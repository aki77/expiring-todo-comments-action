class TestClass
  def initialize
    @value = 0
  end

  def calculate
    # TODO [2030-03-01]: Optimize this algorithm
    result = @value * 2

    # FIXME [2024-12-20]: This method is too slow
    (1..100).each do |i|
      result += i
    end

    result
  end

  private

  def helper_method
    # TODO: Add proper error handling
    puts "Helper method called"
  end
end
