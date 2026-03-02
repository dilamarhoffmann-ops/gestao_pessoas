import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "sa-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

/**
 * Uploads a file buffer to S3 and returns the public URL.
 */
export const uploadFile = async (buffer: Buffer, key: string, contentType: string) => {
    const bucketName = process.env.AWS_S3_BUCKET || "gestao-dp";
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);

    // Public URL (requires bucket to be public)
    const publicUrl = `https://${bucketName}.s3.${s3Client.config.region}.amazonaws.com/${key}`;

    // If use needs a temporary signed URL, we can generate it below.
    return publicUrl;
};

/**
 * Generates a signed URL for an object that lasts for 7 days.
 */
export const getSignedDownloadUrl = async (key: string) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || "gestao-dp",
        Key: key,
    });

    // Maximum allowed expiration is 7 days (604800 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 604800 });
};
