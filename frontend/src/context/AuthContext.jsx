import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword as firebaseUpdatePassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Extended data from Firestore
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch extended user data from Firestore
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUserData(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (name, email, password, specialization) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Update Auth Profile
        await updateProfile(newUser, { displayName: name });

        // Create User Document in Firestore
        const defaultData = {
            name: name,
            email: email,
            username: email.split('@')[0], // Default username from email
            specialization: specialization || 'General Practitioner',
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", newUser.uid), defaultData);
        setUserData(defaultData);
        return newUser;
    };

    const logout = () => {
        return signOut(auth);
    };

    const updateUserProfile = async (updates) => {
        if (!user) throw new Error("No user logged in");

        // 1. Update Auth Profile (Display Name) if provided
        if (updates.name && updates.name !== user.displayName) {
            await updateProfile(user, { displayName: updates.name });
        }

        // 2. Update Firestore Data (Username, Specialization, Name)
        const firestoreUpdates = {};
        if (updates.name) firestoreUpdates.name = updates.name;
        if (updates.username) firestoreUpdates.username = updates.username;
        if (updates.specialization) firestoreUpdates.specialization = updates.specialization;

        if (Object.keys(firestoreUpdates).length > 0) {
            await updateDoc(doc(db, "users", user.uid), firestoreUpdates);
            setUserData(prev => ({ ...prev, ...firestoreUpdates }));
        }
    };

    const changePassword = async (newPassword) => {
        if (!user) throw new Error("No user logged in");
        await firebaseUpdatePassword(user, newPassword);
    };

    const deleteAccount = async (password) => {
        if (!user) throw new Error("No user logged in");

        // Re-authenticate before sensitive operation
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        const uid = user.uid;

        // Delete Firestore Doc
        await deleteDoc(doc(db, "users", uid));

        // Delete Auth User
        await deleteUser(user);
        // State cleans up via onAuthStateChanged
    };

    return (
        <AuthContext.Provider value={{
            user,
            userData, // Expose extended data
            login,
            register,
            logout,
            updateUserProfile,
            changePassword,
            deleteAccount,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
