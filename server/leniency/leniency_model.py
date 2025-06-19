import torch
import torch.nn as nn
import torch.optim as optim
import sys
import json

class LeniencyModel(nn.Module):
    def __init__(self):
        super(LeniencyModel, self).__init__()
        self.linear = nn.Linear(1, 1)

    def forward(self, x):
        return self.linear(x)

def compute_leniency(predicted_scores, actual_scores, epochs=1000):
    X = torch.tensor(predicted_scores, dtype=torch.float32).view(-1, 1)
    y = torch.tensor(actual_scores, dtype=torch.float32).view(-1, 1)

    # Debug input tensors
    print(f"DEBUG: X = {X.tolist()}", file=sys.stderr)
    print(f"DEBUG: y = {y.tolist()}", file=sys.stderr)

    # Normalize (standardization)
    X_mean, X_std = X.mean(), X.std()
    y_mean, y_std = y.mean(), y.std()
    X = (X - X_mean) / (X_std + 1e-8)
    y = (y - y_mean) / (y_std + 1e-8)

    model = LeniencyModel()
    criterion = nn.MSELoss()
    optimizer = optim.SGD(model.parameters(), lr=0.001)

    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(X)
        loss = criterion(outputs, y)

        if torch.isnan(loss):
            print("NaN loss encountered", file=sys.stderr)
            print(f"DEBUG: Outputs = {outputs.tolist()}", file=sys.stderr)
            break

        loss.backward()
        optimizer.step()

    weight = model.linear.weight.item()
    bias = model.linear.bias.item()

    if torch.isnan(torch.tensor(weight)) or torch.isnan(torch.tensor(bias)):
        weight, bias = None, None

    return weight, bias

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        predicted = input_data["predicted"]
        actual = input_data["actual"]

        weight, bias = compute_leniency(predicted, actual)

        output = json.dumps({
            "weight": weight,
            "bias": bias
        })

        print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)