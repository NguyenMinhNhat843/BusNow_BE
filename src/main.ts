import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tạo document + swagger test API
  const config = new DocumentBuilder()
    .setTitle('BussNow API')
    .setDescription('API cho hệ thống đặt vé xe')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Bật validation toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các thuộc tính không được định nghĩa trong DTO
      forbidNonWhitelisted: true, // Ném lỗi nếu có thuộc tính không được định nghĩa trong DTO
      transform: true, // Tự động chuyển đổi kiểu dữ liệu
    }),
  );

  // use cookie parser
  app.use(cookieParser());

  // Bật CORS
  app.enableCors({
    origin: 'http://localhost:4000', // Nếu bên client dùng withCredentials: true thì cần thay '*' bằng địa chỉ cụ thể của client
    methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
