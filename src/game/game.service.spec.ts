import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';

/**
 * @attention   I don't know how to use it, bu this is the place, where I have 
 *              say that there are 1,000,000 requests per second, and I have to
 *              be able to handle them
 */
describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
