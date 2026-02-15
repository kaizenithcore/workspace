import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

export const deleteAccountAndData =
functions.region("us-central1").https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const uid = context.auth.uid;

    if (data?.uid && data.uid !== uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "UID mismatch"
      );
    }

    const db = admin.firestore();

    const topLevelCollections = [
      "categories",
      "projects",
      "tasks",
      "events",
      "time_entries",
      "pomodoro_sessions",
      "notifications",
    ];

    const userScopedCollections = [
      "goals",
      "goal_events",
      "goal_snapshots",
      "challenges",
    ];

    const deleteDocsInBatches = async (
      docs: FirebaseFirestore.QueryDocumentSnapshot[],
    ) => {
      let batch = db.batch();
      let count = 0;

      for (const docSnap of docs) {
        batch.delete(docSnap.ref);
        count += 1;

        if (count >= 450) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    };

    try {
      for (const collectionName of topLevelCollections) {
        const ownerSnapshot = await db
          .collection(collectionName)
          .where("ownerId", "==", uid)
          .get();

        if (!ownerSnapshot.empty) {
          await deleteDocsInBatches(ownerSnapshot.docs);
        }

        const userSnapshot = await db
          .collection(collectionName)
          .where("userId", "==", uid)
          .get();

        if (!userSnapshot.empty) {
          await deleteDocsInBatches(userSnapshot.docs);
        }
      }

      for (const collectionName of userScopedCollections) {
        const docs = await db
          .collection(`users/${uid}/${collectionName}`)
          .listDocuments();

        if (docs.length === 0) {
          continue;
        }

        let batch = db.batch();
        let count = 0;

        for (const docRef of docs) {
          batch.delete(docRef);
          count += 1;

          if (count >= 450) {
            await batch.commit();
            batch = db.batch();
            count = 0;
          }
        }

        if (count > 0) {
          await batch.commit();
        }
      }

      await db.doc(`users/${uid}`).delete();
      await admin.auth().deleteUser(uid);

      return {success: true};
    } catch (err) {
      console.error("deleteAccountAndData error:", err);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to delete account data",
      );
    }
  });
