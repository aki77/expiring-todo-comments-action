class TestClass:
    def __init__(self):
        self.value = 0

    def calculate(self):
        # TODO [2025-04-01]: Optimize this algorithm for better performance
        result = self.value * 2

        # FIXME [2030-12-15]: This loop is inefficient
        for i in range(1, 101):
            result += i

        return result

    def _helper_method(self):
        # TODO: Add proper logging instead of print
        print("Helper method called")

    def process_data(self, data):
        # FIXME [2030-01-15]: Handle edge cases properly
        if not data:
            return None
        return [x * 2 for x in data]
