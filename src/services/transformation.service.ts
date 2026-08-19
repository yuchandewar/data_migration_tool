import { TransformationRule } from '@/types/migration';

/**
 * Service responsible for applying transformation rules to data.
 */
export class TransformationService {
  
  /**
   * Applies a set of rules to an array of data rows.
   * @param data - The data rows
   * @param rules - Array of transformation rules
   * @returns Transformed data rows
   */
  public async transform(data: any[], rules: TransformationRule[]): Promise<any[]> {
    let transformedData = [...data];

    for (const rule of rules) {
      switch (rule.type) {
        case 'RENAME_COLUMN':
          transformedData = this.applyRenameColumn(transformedData, rule);
          break;
        case 'CAST_TYPE':
          transformedData = this.applyCastType(transformedData, rule);
          break;
        case 'FILTER_ROW':
          transformedData = this.applyFilterRow(transformedData, rule);
          break;
        case 'DROP_COLUMN':
          transformedData = this.applyDropColumn(transformedData, rule);
          break;
        // Add more transformation types as needed
        default:
          console.warn(`Unsupported transformation type: ${rule.type}`);
      }
    }

    return transformedData;
  }

  private applyRenameColumn(data: any[], rule: TransformationRule): any[] {
    const { sourceColumn, targetColumn } = rule.config;
    return data.map(row => {
      const newRow = { ...row };
      if (sourceColumn in newRow) {
        newRow[targetColumn] = newRow[sourceColumn];
        delete newRow[sourceColumn];
      }
      return newRow;
    });
  }

  private applyCastType(data: any[], rule: TransformationRule): any[] {
    const { column, targetType } = rule.config;
    return data.map(row => {
      const newRow = { ...row };
      if (column in newRow) {
        if (targetType === 'NUMBER') {
          newRow[column] = Number(newRow[column]);
        } else if (targetType === 'STRING') {
          newRow[column] = String(newRow[column]);
        }
        // Handle other casts...
      }
      return newRow;
    });
  }

  private applyFilterRow(data: any[], rule: TransformationRule): any[] {
    const { column, condition, value } = rule.config;
    return data.filter(row => {
      if (!(column in row)) return true; // Or false depending on strictness
      
      switch (condition) {
        case 'EQUALS': return row[column] === value;
        case 'CONTAINS': return String(row[column]).includes(String(value));
        case 'GREATER_THAN': return Number(row[column]) > Number(value);
        default: return true;
      }
    });
  }

  private applyDropColumn(data: any[], rule: TransformationRule): any[] {
    const { column } = rule.config;
    return data.map(row => {
      const newRow = { ...row };
      if (column in newRow) {
        delete newRow[column];
      }
      return newRow;
    });
  }
}
