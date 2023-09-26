import { Field, InputType } from '@nestjs/graphql';
import { FileUpload } from 'graphql-upload-ts';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

@InputType()
export class FileInput {
  @Field(() => GraphQLUpload)
  image: Promise<FileUpload>;
}