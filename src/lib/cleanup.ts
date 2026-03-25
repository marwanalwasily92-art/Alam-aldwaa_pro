import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "./firebase";

export async function cleanupOldData(userId: string) {
  if (!userId) return;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const cutoffTimestamp = Timestamp.fromDate(twentyFourHoursAgo);

  const historyRef = collection(db, "history");
  // Only query for the current user's old data to respect security rules
  const q = query(
    historyRef, 
    where("user_id", "==", userId),
    where("created_at", "<", cutoffTimestamp)
  );

  try {
    const querySnapshot = await getDocs(q);
    
    for (const document of querySnapshot.docs) {
      const data = document.data();
      
      // Delete from Storage if image_path exists
      if (data.image_path) {
        try {
          const imageRef = ref(storage, data.image_path);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.error("Error deleting storage object:", storageErr);
        }
      }
      
      // Delete from Firestore
      try {
        await deleteDoc(doc(db, "history", document.id));
      } catch (deleteErr) {
        handleFirestoreError(deleteErr, OperationType.DELETE, `history/${document.id}`);
      }
    }
    
    if (querySnapshot.size > 0) {
      console.log(`Cleanup complete: ${querySnapshot.size} records deleted.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('insufficient permissions')) {
      handleFirestoreError(error, OperationType.LIST, "history");
    } else {
      console.error("Error during cleanup:", error);
    }
  }
}
