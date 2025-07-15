interface DataProcessor {
  process(data: number[]): number[]
}

class TestClass implements DataProcessor {
  private value: number

  constructor() {
    this.value = 0
  }

  calculate(): number {
    // TODO [2025-06-01]: Add type safety improvements
    let result = this.value * 2

    // FIXME [2024-12-05]: Use array methods instead of loops
    for (let i = 1; i <= 100; i++) {
      result += i
    }

    return result
  }

  private helperMethod(): void {
    // TODO: Add proper TypeScript strict mode compliance
    console.log('Helper method called')
  }

  process(data: number[]): number[] {
    // FIXME [2025-03-15]: Add input validation with proper error types
    if (!Array.isArray(data)) {
      throw new Error('Invalid input')
    }

    return data.map(x => x * 2)
  }
}
