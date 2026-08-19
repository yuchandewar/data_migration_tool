import { TransformationService } from '../services/transformation.service';
import { TransformationRule } from '../types/migration';

describe('TransformationService', () => {
  let service: TransformationService;

  beforeEach(() => {
    service = new TransformationService();
  });

  it('should rename a column correctly', async () => {
    const data = [{ old_name: 'John', age: 30 }];
    const rules: TransformationRule[] = [
      {
        id: '1',
        type: 'RENAME_COLUMN',
        config: { sourceColumn: 'old_name', targetColumn: 'new_name' }
      }
    ];

    const result = await service.transform(data, rules);
    
    expect(result[0]).toHaveProperty('new_name', 'John');
    expect(result[0]).not.toHaveProperty('old_name');
    expect(result[0]).toHaveProperty('age', 30);
  });

  it('should cast a string to a number', async () => {
    const data = [{ age: '30' }];
    const rules: TransformationRule[] = [
      {
        id: '2',
        type: 'CAST_TYPE',
        config: { column: 'age', targetType: 'NUMBER' }
      }
    ];

    const result = await service.transform(data, rules);
    
    expect(typeof result[0].age).toBe('number');
    expect(result[0].age).toBe(30);
  });

  it('should filter rows based on condition', async () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Bob', age: 40 }
    ];
    
    const rules: TransformationRule[] = [
      {
        id: '3',
        type: 'FILTER_ROW',
        config: { column: 'age', condition: 'GREATER_THAN', value: 28 }
      }
    ];

    const result = await service.transform(data, rules);
    
    expect(result.length).toBe(2);
    expect(result.find(r => r.name === 'Jane')).toBeUndefined();
  });
});
