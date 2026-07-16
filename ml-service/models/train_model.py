# ml-service/models/train_model.py
"""Train the priority RandomForest from labelled historical data.

Usage:
    python models/train_model.py [path/to/training_data.csv]

Writes models/priority_model.pkl and models/encoders.pkl.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from priority_model import PriorityScorer  # noqa: E402

DEFAULT_DATA = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "training_data.csv",
)


def main():
    data_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DATA
    print(f"Training priority model from {data_path} ...")
    scorer = PriorityScorer()
    scorer.train_model(data_path)
    print("Done. Saved priority_model.pkl and encoders.pkl to the models/ directory.")


if __name__ == "__main__":
    main()
