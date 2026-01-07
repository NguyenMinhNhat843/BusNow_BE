import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class S3Service {
  constructor() {}

  private readonly s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_ACCESS_SECRET || '',
    },
  });

  async uploadFile(file: Express.Multer.File, folder = 'user') {
    const fileExt = path.extname(file.originalname); // đuôi mở rộng của file
    const fileName = crypto.randomBytes(16).toString('hex') + fileExt; // tên file + đuôi
    const filePath = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${filePath}`;
  }

  async deleteFile(filePath: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filePath,
    });
    await this.s3.send(command);

    return {
      message: 'Xóa file thành công',
    };
  }
}
