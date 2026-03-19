import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'professor' | 'admin' | 'cashier' | 'chef' | 'super_admin';
  faculty?: string;
  promotion?: string;
  tenantId?: string; // For SaaS multi-tenancy
  tenantName?: string;
  subscriptionStatus?: 'active' | 'inactive';
  libraryAccess?: boolean;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAsDemo: (role: UserData['role']) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signInAsDemo: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
            if (userDoc.exists()) {
              setUser(userDoc.data() as UserData);
              setLoading(false);
            } else {
              // Create new user
              const isSuperAdminEmail = firebaseUser.email === 'kassheritier@telgroups.org';
              
              let role = 'student';
              let tenantId = 'tenant_demo_1';
              let tenantName = 'Université Démo UCCM';

              if (isSuperAdminEmail) {
                role = 'super_admin';
                tenantId = 'SYSTEM';
                tenantName = 'Plateforme SaaS';
              } else if (firebaseUser.email) {
                // Check if this email is assigned as an admin to any institution
                try {
                  const instQuery = query(collection(db, 'institutions'), where('contactEmail', '==', firebaseUser.email));
                  const instSnapshot = await getDocs(instQuery);
                  
                  if (!instSnapshot.empty) {
                    const instDoc = instSnapshot.docs[0];
                    role = 'admin';
                    tenantId = instDoc.id;
                    tenantName = instDoc.data().name;
                  }
                } catch (err) {
                  console.error("Error checking institution admin status:", err);
                }
              }

              const newUser = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Unknown User',
                email: firebaseUser.email || '',
                role,
                tenantId,
                tenantName,
                createdAt: serverTimestamp(),
              };
              
              await setDoc(userDocRef, newUser);
              setUser(newUser as unknown as UserData);
              setLoading(false);

              // Add notification for new user
              try {
                await addDoc(collection(db, 'notifications'), {
                  userId: firebaseUser.uid,
                  message: `Nouvel utilisateur inscrit : ${newUser.name} (${newUser.role})`,
                  read: false,
                  tenantId: newUser.tenantId,
                  createdAt: serverTimestamp()
                });
              } catch (e) {
                console.error("Could not create notification", e);
              }
            }
          }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(null);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error fetching or creating user:", error);
          // Fallback to null if there's a permission error so the app doesn't crash completely
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeUser) {
          unsubscribeUser();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Special case for super admin
      if (email === 'kassheritier@telgroups.org' && password === 'Ariel@2024') {
        const userCred = await signInAnonymously(auth);
        const userDocRef = doc(db, 'users', userCred.user.uid);
        
        const superAdminUser = {
          uid: userCred.user.uid,
          name: 'Kass Heritier',
          email: 'kassheritier@telgroups.org',
          role: 'super_admin',
          tenantId: 'SYSTEM',
          tenantName: 'Plateforme SaaS',
          createdAt: serverTimestamp(),
        };
        
        await setDoc(userDocRef, superAdminUser);
        setUser(superAdminUser as unknown as UserData);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signInAsDemo = async (role: UserData['role']) => {
    try {
      const userCred = await signInAnonymously(auth);
      const userDocRef = doc(db, 'users', userCred.user.uid);
      
      const roleNames = {
        student: 'Étudiant',
        professor: 'Professeur',
        admin: 'Administrateur',
        cashier: 'Caissier',
        chef: 'Chef de Département',
        super_admin: 'Super Admin SaaS'
      };

      const demoUser = {
        uid: userCred.user.uid,
        name: `Démo ${roleNames[role]}`,
        email: `demo.${role}@saas.edu`,
        role: role,
        tenantId: role === 'super_admin' ? 'SYSTEM' : 'tenant_demo_1',
        tenantName: role === 'super_admin' ? 'Plateforme SaaS' : 'Université Démo UCCM',
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, demoUser);
      setUser(demoUser as unknown as UserData);
    } catch (error: any) {
      console.error("Error signing in as demo", error);
      if (error.code === 'auth/operation-not-allowed') {
        console.error("L'authentification anonyme n'est pas activée. Veuillez l'activer dans la console Firebase (Authentication > Sign-in method > Anonymous).");
      } else if (error.code === 'auth/admin-restricted-operation') {
        console.error("Erreur de permission Firebase. Pour utiliser le mode démo, vous devez :\n\n1. Activer l'authentification Anonyme (Authentication > Sign-in method)\n2. Activer la création de compte (Authentication > Settings > User Actions > Cochez 'Enable create (sign-up)')");
      } else {
        console.error("Erreur lors de la connexion de démonstration : " + error.message);
      }
      throw error; // Let the caller handle it
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithEmail, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
