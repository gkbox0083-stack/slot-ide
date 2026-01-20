// src/firebase/firestore.ts

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Template, TemplateInput } from '../types/template';

const TEMPLATES_COLLECTION = 'templates';

/**
 * 轉換 Firestore 文檔為 Template
 */
function docToTemplate(docSnapshot: any): Template {
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    };
}

/**
 * 建立模板
 */
export async function createTemplate(
    userId: string,
    input: TemplateInput
): Promise<Template> {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
        ...input,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    const newDoc = await getDoc(docRef);
    return docToTemplate(newDoc);
}

/**
 * 讀取用戶的所有模板
 */
export async function getTemplatesByUser(userId: string): Promise<Template[]> {
    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToTemplate);
}

/**
 * 讀取單一模板
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        return null;
    }

    return docToTemplate(snapshot);
}

/**
 * 更新模板
 */
export async function updateTemplate(
    templateId: string,
    input: Partial<TemplateInput>
): Promise<void> {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(docRef, {
        ...input,
        updatedAt: serverTimestamp(),
    });
}

/**
 * 刪除模板
 */
export async function deleteTemplate(templateId: string): Promise<void> {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
}
