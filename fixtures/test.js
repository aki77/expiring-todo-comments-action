class TestClass {
  constructor() {
    this.value = 0
  }

  calculate() {
    // TODO [2025-05-01]: Implement proper error handling
    let result = this.value * 2

    // FIXME [2024-12-10]: This should use reduce for better performance
    for (let i = 1; i <= 100; i++) {
      result += i
    }

    return result
  }

  helperMethod() {
    // TODO: Add JSDoc documentation
    console.log('Helper method called')
  }

  processData(data) {
    // FIXME [2025-02-15]: Validate input data
    if (!Array.isArray(data)) {
      return null
    }

    return data.map(x => x * 2)
  }
}
