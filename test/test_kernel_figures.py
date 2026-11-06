"""Run with a Python environment containing matplotlib and numpy:
    MPLBACKEND=Agg python -m unittest discover -s test -p 'test_kernel_figures.py'
"""
import importlib.util
from pathlib import Path
import base64
import unittest
import warnings

spec = importlib.util.spec_from_file_location(
    "zef_kernel", Path(__file__).resolve().parents[1] / "kernel/zef_kernel.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class KernelFigureTests(unittest.TestCase):
    def setUp(self):
        self.kernel = module.ZefKernel()
        result = self.kernel.execute("import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt")
        self.assertEqual(result['status'], 'ok', result['error'])

    def test_harmonic_potential_with_persistent_setup(self):
        setup = self.kernel.execute("import numpy as np; m = omega = 1.; x = np.linspace(-10, 10, 601)")
        self.assertEqual(setup['status'], 'ok', setup['error'])
        with warnings.catch_warnings():
            warnings.simplefilter('always')
            result = self.kernel.execute("""
V = 0.5 * m * omega**2 * x**2
plt.figure(figsize=(8, 3))
plt.plot(x, V, 'k-', linewidth=1.5)
plt.xlabel('x')
plt.ylabel('V(x)')
plt.title('Harmonic oscillator potential')
plt.ylim(0, 30)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()
""", 'potential')
        self.assertEqual(result['cell_id'], 'potential')
        self.assertEqual(result['status'], 'ok', result['error'])
        self.assertEqual(len(result['figures']), 1)
        self.assertTrue(base64.b64decode(result['figures'][0]['data']).startswith(b'\x89PNG\r\n\x1a\n'))
        # A later non-plot cell must not replay an old figure.
        self.assertEqual(self.kernel.execute('1 + 1')['figures'], [])

    def test_multiple_figures_with_output(self):
        result = self.kernel.execute("plt.figure(); plt.plot([1, 2]); print('hello'); plt.figure(); plt.plot([3, 4])")
        self.assertEqual(result['status'], 'ok', result['error'])
        self.assertEqual(len(result['figures']), 2)
        self.assertIn('hello', result['stdout'])


if __name__ == '__main__':
    unittest.main()
