# Preços de Água Mineral

Plataforma web responsiva para acompanhamento de preços de garrafas e embalagens de água mineral (PET e outros tipos), com foco em Norte/Nordeste e destaque para Manaus/AM.

## Funcionalidades
- Filtros por data, estado, cidade, embalagem/litragem, marca, canal e fonte (com atualização dinâmica para evitar combinações inválidas).
- Botão **Limpar filtros** para reset rápido.
- Cards com métricas principais.
- Gráficos comparativos:
  - Barras: preço médio atacado x varejo por estado.
  - Linha: timeline da variação de preços ao longo do tempo.
- Exibição de **data da última atualização** no topo.
- Estrutura preparada para atualização automática diária com agente de coleta.

## Executar localmente
```bash
python3 -m http.server 8080
```
Depois abra: `http://localhost:8080`

## Agente de pesquisa (coleta automática)
O agente está em `scripts/price_agent.py` e atualiza `data/prices.json`.

### Execução manual
```bash
python3 scripts/price_agent.py
```

### Janela e horário solicitados
A automação foi configurada para tentar rodar diariamente às 07:00 (foco Manaus) e só aplicar atualização entre **09/03/2026 e 31/03/2026**.

- Workflow: `.github/workflows/daily-price-agent.yml`
- O script valida o intervalo de datas antes de atualizar os dados.

## Fontes
As fontes são configuráveis em `config/sources.json`.
O site exibe uma seção **Fontes/Sites monitorados** para listar todas as URLs cadastradas, mesmo quando ainda não há linha de preço para um filtro específico.
No estado atual, há exemplos de canais digitais (marketplaces/rede social/site) e fonte governamental (BuscaPreço AM / Sefaz-AM).

## Deploy permanente
O projeto é estático e pode ser hospedado permanentemente em:
- GitHub Pages
- Netlify
- Vercel

Se o repositório estiver no GitHub, basta habilitar GitHub Pages para deploy contínuo.


## Observações de fonte
- A base inicial inclui a fonte **BuscaPreço AM / Sefaz-AM** com URL de pesquisa em Manaus.
