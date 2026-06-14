import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

export async function finalizarPedido(carrinho) {
  const user = auth.currentUser;

  if (!user) return;

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    produtos: carrinho,
    status: "pendente",
    createdAt: serverTimestamp()
  });
}