// src/firebase/storage.ts

import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll
} from 'firebase/storage';
import { storage } from './config';

export interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    progress: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * 上傳圖片
 */
export async function uploadImage(
    userId: string,
    file: File,
    onProgress?: UploadProgressCallback
): Promise<string> {
    // 生成唯一檔名
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}.${extension}`;

    const storageRef = ref(storage, `users/${userId}/assets/${fileName}`);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                if (onProgress) {
                    onProgress({
                        bytesTransferred: snapshot.bytesTransferred,
                        totalBytes: snapshot.totalBytes,
                        progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                    });
                }
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

/**
 * 刪除圖片
 */
export async function deleteImage(url: string): Promise<void> {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
}

/**
 * 列出用戶的所有素材
 */
export async function listUserAssets(userId: string): Promise<string[]> {
    const listRef = ref(storage, `users/${userId}/assets`);
    const result = await listAll(listRef);

    const urls = await Promise.all(
        result.items.map((item) => getDownloadURL(item))
    );

    return urls;
}
