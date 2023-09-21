import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FortyTwoGuard extends AuthGuard('42') {
  constructor() {
    super();
    // Vous pouvez ajouter des configurations spécifiques ici si nécessaire
  }
}
