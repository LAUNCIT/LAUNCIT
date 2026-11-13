import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, updatePassword, User } from 'firebase/auth';
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  ActivityCategory,
  BusinessDoc,
  BusinessMember,
  BusinessMembershipSummary,
  ServiceCategory,
  UserRole,
} from '../types';
import {
  CATEGORY_LABELS,
  DEFAULT_WHATSAPP_CONFIG,
  INITIAL_WORKING_DAYS,
  SUBCATEGORY_LABELS,
} from '../data/initialData';

const DEACTIVATED_MSG =
  'Tu acceso fue desactivado. Contacta al administrador de tu negocio';

interface CreateBusinessInput {
  name: string;
  category: ServiceCategory;
  phone?: string;
  address?: string;
  description?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberships: BusinessMembershipSummary[];
  activeBusiness: BusinessDoc | null;
  activeMember: BusinessMember | null;
  userRole: UserRole | null;
  needsBusinessSelection: boolean;
  mustChangePassword: boolean;
  authError: string | null;
  clearAuthError: () => void;
  setAuthError: (msg: string | null) => void;
  selectBusiness: (negocioId: string) => Promise<void>;
  requestSwitchBusiness: () => void;
  refreshSessionData: () => Promise<void>;
  createBusinessForOwner: (input: CreateBusinessInput) => Promise<BusinessDoc>;
  completePasswordChange: (newPassword: string) => Promise<void>;
  logActivity: (params: {
    accion: string;
    detalle: string;
    categoria: ActivityCategory;
    negocioIdOverride?: string;
    memberOverride?: BusinessMember;
  }) => Promise<void>;
  refreshActiveBusinessDoc: (updatedFields?: Partial<BusinessDoc>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  memberships: [],
  activeBusiness: null,
  activeMember: null,
  userRole: null,
  needsBusinessSelection: false,
  mustChangePassword: false,
  authError: null,
  clearAuthError: () => {},
  setAuthError: () => {},
  selectBusiness: async () => {},
  requestSwitchBusiness: () => {},
  refreshSessionData: async () => {},
  createBusinessForOwner: async () => {
    throw new Error('AuthProvider not initialized');
  },
  completePasswordChange: async () => {},
  logActivity: async () => {},
  refreshActiveBusinessDoc: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<BusinessMembershipSummary[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessDoc | null>(null);
  const [activeMember, setActiveMember] = useState<BusinessMember | null>(null);
  const [needsBusinessSelection, setNeedsBusinessSelection] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const preserveErrorOnNextSignOutRef = useRef(false);
  const selectedNegocioIdRef = useRef<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const refreshActiveBusinessDoc = useCallback((updatedFields?: Partial<BusinessDoc>) => {
    if (!updatedFields) return;
    setActiveBusiness((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  }, []);

  const logActivity = useCallback(
    async ({
      accion,
      detalle,
      categoria,
      negocioIdOverride,
      memberOverride,
    }: {
      accion: string;
      detalle: string;
      categoria: ActivityCategory;
      negocioIdOverride?: string;
      memberOverride?: BusinessMember;
    }) => {
      const targetNegocioId = negocioIdOverride || activeBusiness?.id;
      const actor = memberOverride || activeMember;
      if (!targetNegocioId || !actor) return;

      try {
        await addDoc(collection(db, 'negocios', targetNegocioId, 'actividad'), {
          negocioId: targetNegocioId,
          actorUid: actor.uid,
          actorNombre: actor.nombre || actor.email,
          actorEmail: actor.email,
          actorRol: actor.rol,
          accion,
          detalle,
          categoria,
          fecha: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('No se pudo registrar actividad en Firestore:', err);
      }
    },
    [activeBusiness?.id, activeMember]
  );

  const activateMemberForBusiness = useCallback(
    async (firebaseUser: User, negocioId: string) => {
      const memberSnap = await getDoc(
        doc(db, 'negocios', negocioId, 'miembros', firebaseUser.uid)
      );
      if (!memberSnap.exists()) {
        throw new Error('No perteneces a este negocio.');
      }

      const memberData = memberSnap.data() as BusinessMember;
      if (memberData.activo === false) {
        preserveErrorOnNextSignOutRef.current = true;
        setAuthError(DEACTIVATED_MSG);
        selectedNegocioIdRef.current = null;
        setActiveBusiness(null);
        setActiveMember(null);
        setNeedsBusinessSelection(false);
        setMustChangePassword(false);
        await signOut(auth);
        return;
      }

      const bizSnap = await getDoc(doc(db, 'negocios', negocioId));
      if (!bizSnap.exists()) {
        throw new Error('El negocio seleccionado no existe.');
      }

      const bizData = { ...(bizSnap.data() as BusinessDoc), id: bizSnap.id };
      selectedNegocioIdRef.current = negocioId;
      setActiveMember({ ...memberData, uid: firebaseUser.uid, negocioId });
      setActiveBusiness(bizData);
      setNeedsBusinessSelection(false);
      setMustChangePassword(memberData.mustChangePassword === true);
    },
    []
  );

  const resolveMemberships = useCallback(
    async (firebaseUser: User, preferredNegocioId?: string | null) => {
      try {
        const candidateIds = new Set<string>();

        // 1. User's membership index (/usuarios/{uid}/membresias)
        try {
          const idxSnap = await getDocs(
            collection(db, 'usuarios', firebaseUser.uid, 'membresias')
          );
          idxSnap.forEach((d) => {
            const data = d.data();
            candidateIds.add(data?.negocioId || d.id);
          });
        } catch (err) {
          console.warn('Error leyendo índice de membresías:', err);
        }

        // 2. Collection group fallback/discovery
        try {
          const cgQuery = query(
            collectionGroup(db, 'miembros'),
            where('uid', '==', firebaseUser.uid)
          );
          const cgSnap = await getDocs(cgQuery);
          cgSnap.forEach((d) => {
            const parentBiz = d.ref.parent.parent;
            if (parentBiz?.id) candidateIds.add(parentBiz.id);
          });
        } catch (err) {
          // Single-field collectionGroup index may not be enabled yet; ignore silently
        }

        // 3. Direct owner businesses fallback
        try {
          const ownerQuery = query(
            collection(db, 'negocios'),
            where('ownerUid', '==', firebaseUser.uid)
          );
          const ownerSnap = await getDocs(ownerQuery);
          for (const bizDoc of ownerSnap.docs) {
            candidateIds.add(bizDoc.id);
            const memberRef = doc(db, 'negocios', bizDoc.id, 'miembros', firebaseUser.uid);
            const memberCheck = await getDoc(memberRef);
            if (!memberCheck.exists()) {
              const bizData = bizDoc.data();
              const backfillMember: BusinessMember = {
                uid: firebaseUser.uid,
                negocioId: bizDoc.id,
                negocioNombre: bizData.name || 'Mi Negocio',
                nombre:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split('@')[0] ||
                  'Propietario',
                email: (firebaseUser.email || '').toLowerCase(),
                rol: 'propietario',
                activo: true,
                mustChangePassword: false,
                createdAt: new Date().toISOString(),
              };
              await setDoc(memberRef, backfillMember).catch(() => {});
              await setDoc(
                doc(db, 'usuarios', firebaseUser.uid, 'membresias', bizDoc.id),
                {
                  negocioId: bizDoc.id,
                  negocioNombre: bizData.name || 'Mi Negocio',
                  rol: 'propietario',
                  activo: true,
                }
              ).catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Error verificando negocios del propietario:', err);
        }

        // Verify canonical /negocios/{id}/miembros/{uid} docs
        const verifiedSummaries: BusinessMembershipSummary[] = [];
        for (const bizId of candidateIds) {
          try {
            const mSnap = await getDoc(
              doc(db, 'negocios', bizId, 'miembros', firebaseUser.uid)
            );
            if (mSnap.exists()) {
              const mData = mSnap.data() as BusinessMember;
              verifiedSummaries.push({
                negocioId: bizId,
                negocioNombre: mData.negocioNombre || 'Negocio',
                rol: mData.rol,
                activo: mData.activo !== false,
              });
            }
          } catch (err) {
            console.warn(`No se pudo verificar miembro para negocio ${bizId}:`, err);
          }
        }

        setMemberships(verifiedSummaries);

        if (verifiedSummaries.length === 0) {
          setActiveBusiness(null);
          setActiveMember(null);
          setNeedsBusinessSelection(false);
          setMustChangePassword(false);
          return;
        }

        // If ALL memberships are deactivated, block and sign out immediately
        const activeOnes = verifiedSummaries.filter((m) => m.activo);
        if (activeOnes.length === 0) {
          preserveErrorOnNextSignOutRef.current = true;
          setAuthError(DEACTIVATED_MSG);
          selectedNegocioIdRef.current = null;
          setActiveBusiness(null);
          setActiveMember(null);
          setNeedsBusinessSelection(false);
          setMustChangePassword(false);
          await signOut(auth);
          return;
        }

        const targetId =
          preferredNegocioId &&
          verifiedSummaries.some((m) => m.negocioId === preferredNegocioId)
            ? preferredNegocioId
            : selectedNegocioIdRef.current &&
                verifiedSummaries.some(
                  (m) => m.negocioId === selectedNegocioIdRef.current
                )
              ? selectedNegocioIdRef.current
              : null;

        if (targetId) {
          await activateMemberForBusiness(firebaseUser, targetId);
        } else if (verifiedSummaries.length === 1) {
          await activateMemberForBusiness(
            firebaseUser,
            verifiedSummaries[0].negocioId
          );
        } else {
          // User belongs to >1 business: require explicit selection
          setActiveBusiness(null);
          setActiveMember(null);
          setMustChangePassword(false);
          setNeedsBusinessSelection(true);
        }
      } catch (err: any) {
        console.error('Error resolviendo permisos del usuario:', err);
        setAuthError(
          err?.message || 'Error al cargar los permisos de tu cuenta en Firebase.'
        );
      }
    },
    [activateMemberForBusiness]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setMemberships([]);
        setActiveBusiness(null);
        setActiveMember(null);
        setNeedsBusinessSelection(false);
        setMustChangePassword(false);
        selectedNegocioIdRef.current = null;
        if (!preserveErrorOnNextSignOutRef.current) {
          // Keep any explicit error only when triggered by deactivated check
        }
        preserveErrorOnNextSignOutRef.current = false;
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setAuthError(null);
      await resolveMemberships(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [resolveMemberships]);

  const selectBusiness = useCallback(
    async (negocioId: string) => {
      if (!user) return;
      setLoading(true);
      setAuthError(null);
      try {
        await activateMemberForBusiness(user, negocioId);
      } catch (err: any) {
        setAuthError(err?.message || 'No se pudo ingresar al negocio.');
      } finally {
        setLoading(false);
      }
    },
    [user, activateMemberForBusiness]
  );

  const requestSwitchBusiness = useCallback(() => {
    if (memberships.length > 1) {
      setNeedsBusinessSelection(true);
    }
  }, [memberships.length]);

  const refreshSessionData = useCallback(async () => {
    if (!user) return;
    await resolveMemberships(user, activeBusiness?.id || selectedNegocioIdRef.current);
  }, [user, resolveMemberships, activeBusiness?.id]);

  const createBusinessForOwner = useCallback(
    async (input: CreateBusinessInput): Promise<BusinessDoc> => {
      if (!user) {
        throw new Error('Debes iniciar sesión para crear un negocio.');
      }
      const negocioId = `neg_${user.uid.slice(0, 6)}_${Date.now()}`;
      const cleanName = input.name.trim();
      const categoryLabel = CATEGORY_LABELS[input.category] || 'Negocio';
      const subCategory = SUBCATEGORY_LABELS[input.category]?.[0] || 'General';
      const nowIso = new Date().toISOString();

      const newBusiness: BusinessDoc = {
        id: negocioId,
        name: cleanName,
        category: input.category,
        categoryLabel,
        subCategory,
        phone: input.phone?.trim() || '+57 ',
        address: input.address?.trim() || 'Colombia',
        location: input.address?.trim() || 'Colombia',
        description:
          input.description?.trim() ||
          `${cleanName} — Reserva directa de servicios sin registro.`,
        image:
          input.image ||
          'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
        photos: [
          input.image ||
            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
        ],
        ownerUid: user.uid,
        plan: 'basico',
        limiteUsuarios: 1,
        activo: true,
        whatsAppConfig: {
          ...DEFAULT_WHATSAPP_CONFIG,
          businessPhone: input.phone?.trim() || '+57 ',
        },
        workingDays: INITIAL_WORKING_DAYS,
        createdAt: nowIso,
      };

      const ownerMember: BusinessMember = {
        uid: user.uid,
        negocioId,
        negocioNombre: cleanName,
        nombre:
          user.displayName || user.email?.split('@')[0] || 'Propietario',
        email: (user.email || '').toLowerCase(),
        rol: 'propietario',
        activo: true,
        mustChangePassword: false,
        createdAt: nowIso,
        createdBy: user.uid,
      };

      await setDoc(doc(db, 'negocios', negocioId), newBusiness);
      await setDoc(
        doc(db, 'negocios', negocioId, 'miembros', user.uid),
        ownerMember
      );
      await setDoc(
        doc(db, 'usuarios', user.uid, 'membresias', negocioId),
        {
          negocioId,
          negocioNombre: cleanName,
          rol: 'propietario',
          activo: true,
          updatedAt: nowIso,
        }
      );

      await logActivity({
        accion: 'Negocio creado',
        detalle: `Se registró el negocio "${cleanName}" con plan Gratis (1 usuario).`,
        categoria: 'configuracion',
        negocioIdOverride: negocioId,
        memberOverride: ownerMember,
      });

      selectedNegocioIdRef.current = negocioId;
      await resolveMemberships(user, negocioId);
      return newBusiness;
    },
    [user, logActivity, resolveMemberships]
  );

  const completePasswordChange = useCallback(
    async (newPassword: string) => {
      if (!auth.currentUser || !activeMember || !activeBusiness) {
        throw new Error('No hay sesión activa.');
      }

      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(
        doc(db, 'negocios', activeBusiness.id, 'miembros', auth.currentUser.uid),
        { mustChangePassword: false }
      );

      const updatedMember: BusinessMember = {
        ...activeMember,
        mustChangePassword: false,
      };
      setActiveMember(updatedMember);
      setMustChangePassword(false);

      await logActivity({
        accion: 'Contraseña temporal cambiada',
        detalle: `${updatedMember.nombre} (${updatedMember.email}) actualizó su contraseña temporal en su primer ingreso.`,
        categoria: 'equipo',
        memberOverride: updatedMember,
      });
    },
    [activeBusiness, activeMember, logActivity]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        memberships,
        activeBusiness,
        activeMember,
        userRole: activeMember?.rol || null,
        needsBusinessSelection,
        mustChangePassword,
        authError,
        clearAuthError,
        setAuthError,
        selectBusiness,
        requestSwitchBusiness,
        refreshSessionData,
        createBusinessForOwner,
        completePasswordChange,
        logActivity,
        refreshActiveBusinessDoc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
