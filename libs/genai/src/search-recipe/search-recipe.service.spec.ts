import { Test, TestingModule } from '@nestjs/testing';
import { SearchRecipeService } from './search-recipe.service';

describe('SearchRecipeService', () => {
  let service: SearchRecipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchRecipeService],
    }).compile();

    service = module.get<SearchRecipeService>(SearchRecipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
