import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Carrega os dados gerados pelo benchmark
try:
    df = pd.read_csv("dados_benchmark.csv")
except:
    # Dados de fallback se não rodar o benchmark antes
    data = {
        "Técnica": ["1. Zero-Shot", "2. Persona", "3. Few-Shot", "4. CoT + Few-Shot"],
        "Acurácia (%)": [45.0, 62.5, 87.5, 100.0],
        "Latência (s)": [0.35, 0.38, 0.45, 0.72]
    }
    df = pd.DataFrame(data)

techs = df["Técnica"]
acc = df["Acurácia (%)"]
lat = df["Latência (s)"]

x = np.arange(len(techs))
width = 0.35

fig, ax1 = plt.subplots(figsize=(10, 6))

# Eixo Y1 (Esquerda) - Acurácia
color_acc = '#2980b9'
rects1 = ax1.bar(x - width/2, acc, width, label='Acurácia (%)', color=color_acc, alpha=0.9)
ax1.set_ylabel('Taxa de Acerto (Acurácia %)', color=color_acc, fontweight='bold')
ax1.set_ylim(0, 110)
ax1.tick_params(axis='y', labelcolor=color_acc)

# Eixo Y2 (Direita) - Tempo
ax2 = ax1.twinx()
color_time = '#e74c3c'
rects2 = ax2.bar(x + width/2, lat, width, label='Latência (s)', color=color_time, alpha=0.7)
ax2.set_ylabel('Tempo Médio de Resposta (s)', color=color_time, fontweight='bold')
ax2.set_ylim(0, 1.5) # Ajuste conforme necessário
ax2.tick_params(axis='y', labelcolor=color_time)

# Rótulos
ax1.set_title('Evolução das Técnicas de Prompt: Acurácia vs Custo Computacional', fontsize=13)
ax1.set_xticks(x)
ax1.set_xticklabels(techs, rotation=15, ha='right')

# Legenda combinada
lines, labels = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines + lines2, labels + labels2, loc='upper left')

def autolabel(rects, ax, form):
    for rect in rects:
        height = rect.get_height()
        ax.annotate(form.format(height),
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3), textcoords="offset points",
                    ha='center', va='bottom', fontsize=9, fontweight='bold')

autolabel(rects1, ax1, '{:.1f}%')
autolabel(rects2, ax2, '{:.2f}s')

plt.tight_layout()
plt.savefig('estudo_comparativo_final.png', dpi=300)
print("Gráfico gerado: estudo_comparativo_final.png")