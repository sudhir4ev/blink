import { Test, TestingModule } from '@nestjs/testing';
import { JanuService } from './janu.service';

describe('JanuService', () => {
  let service: JanuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JanuService],
    }).compile();

    service = module.get<JanuService>(JanuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
