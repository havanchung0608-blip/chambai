import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc, 
  Query, 
  DocumentReference, 
  CollectionReference 
} from "firebase/firestore";
import { db } from "./firebase";
import { handleFirestoreError, OperationType } from "./firestore-error-handler";

export const getDocuments = async (q: Query, path: string) => {
  try {
    return await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const createDocument = async (colRef: CollectionReference, data: any, path: string) => {
  try {
    return await addDoc(colRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const getDocument = async (docRef: DocumentReference, path: string) => {
  try {
    return await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};

export const updateDocument = async (docRef: DocumentReference, data: any, path: string) => {
  try {
    return await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};
