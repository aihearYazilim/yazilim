"""Audit helpers: import the original pipeline read-only (no bytecode writes)."""
import sys, os, pathlib
sys.dont_write_bytecode = True
ORIG = pathlib.Path(__file__).resolve().parents[1] / "options"
sys.path.insert(0, str(ORIG))
_cwd = os.getcwd(); os.chdir(ORIG)
import run as R   # loads chains, deliveries, dvol, prices; builds ENT, FEAT
os.chdir(_cwd)
