import { auth, db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ADICIONAR PRODUTO
export async function addProduct(produto) {
  await addDoc(collection(db, "products"), produto);
}

// LISTAR PRODUTOS
export async function getProducts() {
  const snap = await getDocs(collection(db, "products"));

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// REMOVER PRODUTO
export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}