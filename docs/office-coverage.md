# Cobertura do front do escritório — demonstração

Atualizado em 2026-11-06. Repositório: `juridico-escritorio` (Lovable/TanStack).

## Fontes comparadas

- Obsidian `01-Visao-do-produto.md`, `06-Experiencia-e-notificacoes.md`, `07-Documentos-WhatsApp-e-financeiro.md`, `08-Backlog-e-criterios-de-aceite.md`, `20-Fluxos-de-Negocio-e-Eventos-End-to-End.md` e `25-Frontend-Handoff-Web-First.md`: jornadas e comportamentos do front que podem ser demonstrados sem backend.
- Obsidian `19-UX-Mapa-de-Telas-e-Fluxos-Web.md`: rotas e estados esperados para o app Office.
- Obsidian `35-Matriz-Curadoria-200-Telas.md`: referências visuais `keep`, `future` e `discard`.
- Obsidian `51-Stitch-Telas-Pendentes-10-Web-Office-2026-11-04.md`: 2 telas Fase 1 e 8 conceitos Fase 2.
- Obsidian `65-Integracao-Web-Office-OFFN18-RelatoriosP2-61-Telas-QA-2026-11-04.md`: 61 HTML Stitch no **outro** aplicativo `/srv/projects/jurido/workspace/apps/web-office`.
- Obsidian `68-Redesign-UX-Frontend-Web-Office-61-Telas-2026-11-04.md`: identidade Inter/Manrope, jade/petróleo, superfícies claras e a ressalva de não exibir sincronização fictícia.
- Obsidian `57-Validacao-Lacunas-Telas-Relatorios-Office-Settings-Admin-2026-11-04.md` e `75`–`77`: relatórios como conceito P2, limite de demonstração, estados e filtros esperados.

## Estado deste repositório

Há 63 arquivos de rota cujo nome começa com `o.$org`: o shell do escritório, uma rota índice que encaminha `/o/$org` para `/inicio` e 61 telas de módulo/detalhe. A navegação usa `/o/$org/*` e `AppShell`. Dados demonstrativos de domínio ficam em `src/features/demo`; listas passam por `useOfficeView` para filtro de escritório e caso visível. A matriz de curadoria tem 49 referências `web-office | keep`, com correspondência de rota/fluxo identificada na auditoria estática.

### Rastreabilidade das referências `keep`

Contagem refeita diretamente nas linhas de `35-Matriz-Curadoria-200-Telas.md` com aplicação `web-office` e decisão `keep`: **49 registros**. A correspondência abaixo é de cobertura por jornada/tela neste repositório Lovable; não afirma paridade visual com os HTML Stitch da VPS.

| Nºs na matriz | Referência resumida | Rota ou fluxo correspondente neste repositório |
|---|---|---|
| 3, 19 | WhatsApp supervisionado | `/o/$org/comunicacao` e detalhe; revisão e confirmação manuais |
| 15 | Assinatura e consumo | `/o/$org/assinatura` |
| 20 | Caixa de trabalho | `/o/$org/caixa-de-trabalho` |
| 22, 86 | Confidencialidade por caso/documento | `/o/$org/sigilo` e concessões na ficha do caso |
| 25 | Perfil institucional, unidades e timbrado | `/o/$org/perfil-escritorio`; preview de modelo em `/o/$org/modelos` |
| 35 | Preferências pessoais | `/o/$org/preferencias` |
| 36, 87 | Preview timbrado e editor de modelos | `/o/$org/modelos` e `/o/$org/modelos/$id` |
| 38 | Substituições temporárias | `/o/$org/substituicoes` |
| 40, 84 | Novo caso com múltiplos vínculos | `/o/$org/casos` e diálogo de criação em `AppShell` |
| 41, 88 | Revisão de prazo e agenda | `/o/$org/prazos`, `/o/$org/prazos/$id`, `/o/$org/agenda` |
| 46, 49 | Meu Dia e cockpit | `/o/$org/inicio` e diálogo Meu Dia |
| 52, 62 | Honorários e reembolsos | `/o/$org/financeiro` e detalhe financeiro |
| 56 | Boas-vindas/configuração inicial | `/o/$org/primeiros-passos` |
| 68, 149 | Perfil de colaborador e OAB | `/o/$org/equipe/$id` |
| 77 | Ajuda e suporte | `/o/$org/suporte` |
| 78, 166 | Equipe, áreas e unidades | `/o/$org/equipe` e `/o/$org/estrutura` |
| 80, 122 | Cadastro de cliente PJ/PF | `/o/$org/clientes/novo` |
| 81 | Central de notificações | `/o/$org/notificacoes` |
| 101 | Atendimento e triagem | `/o/$org/atendimentos` |
| 106 | Acesso negado, indisponibilidade e recurso sem licença | `/o/$org/acesso-negado`, `/o/$org/indisponivel`, `/o/$org/sem-licenca` |
| 109, 147 | Caso 360 e permissões documentais | `/o/$org/casos/$id` |
| 112 | Atividades e auditoria demonstrativa | `/o/$org/atividade` |
| 114 | Conflitos de interesse | `/o/$org/conflitos` |
| 116 | Gestão de casos/demandas | `/o/$org/casos` |
| 119 | Gestão de processos | `/o/$org/processos` e detalhe |
| 125 | Biblioteca e compartilhamento de documentos | `/o/$org/documentos` e preview |
| 156 | Convites do portal do cliente | `/o/$org/convites` |
| 162 | Modelos de peças processuais | `/o/$org/modelos` e `/o/$org/procuracoes` |
| 167 | Matriz de papéis/permissões | `/o/$org/permissoes` |
| 169 | Detalhe de tarefa e colaboração | `/o/$org/tarefas/$id` |
| 175 | CRM de clientes | `/o/$org/clientes` e detalhe |
| 191 | Login demonstrativo | `/login` |
| 195 | Bancos conectados (ilustrativo) | `/o/$org/financeiro/bancos` |
| 196 | Consentimento/revogação/reconexão (ilustrativo) | `/o/$org/financeiro/consentimentos` |
| 197 | Assistente Open Finance (ilustrativo) | `/o/$org/financeiro/conexao` |
| 198 | Conciliação financeira (ilustrativa) | `/o/$org/financeiro/conciliacao` |
| 199 | Extrato unificado (ilustrativo) | `/o/$org/financeiro/extrato` |
| 200 | Saldos consolidados (ilustrativo) | `/o/$org/financeiro/saldos` |

Cobertura de jornadas: Início/Meu Dia, caixa, notificações e atividade; atendimentos, conflitos, clientes PF/PJ, convites, casos, processos, prazos, tarefas, agenda, ficha 360 do caso e dossiê com concessões por documento; documentos, modelos/editor, procurações, comunicações/revisão manual; financeiro/detalhe, relatórios; equipe/ficha, estrutura, substituições, permissões, sigilo, perfil, integrações, assinatura, suporte, configurações, preferências, primeiros passos, segurança da conta e acesso negado. A seleção de escritório e o login demonstrativo ficam fora de `/o/$org/*`, antes de entrar no tenant.

O cadastro de caso aceita múltiplos clientes, responsáveis e processo inicial opcional; a ficha do profissional exibe OAB fictícia. Perfil institucional permite editar razão social, nome de exibição, endereço, contatos, unidades, registro OAB e signatários; mantém rascunho, revisão humana por outra pessoa da gestão/sociedade, aprovação/rejeição com motivo e histórico demonstrativo de versões/datas. A logo segue como prévia local de sessão. O convite de colaborador fica separado do convite ao portal do cliente: demonstra função, área/equipe, validade, estados de ciclo e reserva ilustrativa de assentos, sem mandar e-mail, criar autenticação ou efetivar membership. O catálogo `Conceitos Fase 2` contém 4 telas de análise contratual assistida, 6 de Open Finance ilustrativo e 4 de preparação fiscal. Essas telas são visuais: não executam IA, conexão bancária, apuração, emissão ou consentimento real. Relatórios também são identificados como conceito Fase 2.

Na continuidade atual, `/o/$org` encaminha ao painel; a revisão de comunicação exige destinatário escolhido entre os clientes visíveis vinculados ao caso e não tenta associar outra pessoa por aproximação. A agenda permite à gestão consultar compromissos sem caso atribuídos a terceiros; perfis sem gestão só podem atribuir o próprio compromisso. Propostas iniciais de prazo pedem fonte, fundamento opcional, responsável, data/hora local e observações. Tarefas seguem transições permitidas e exigem revisão antes de concluir; o cadastro demonstra solicitante, instruções, processo vinculado e evento opcional na agenda. O caso possui checklist documental separado dos arquivos realmente presentes no dossiê. Preferências, alertas do escritório e anotações das jornadas conceituais de análise contratual/preparação fiscal gravam escolhas na store demonstrativa em memória, com escopo de escritório e perfil. O suporte avisa para não incluir dados pessoais ou conteúdo jurídico e usa categoria e referência demo. As áreas de segurança e primeiros passos usam navegação com rótulos semânticos acessíveis.

As ações rápidas globais abrem atendimento, caso, tarefa, cliente PF/PJ e documento; os formulários reusam suas telas completas, sem o cadastro simplificado duplicado de cliente. Atendimento só avança à aprovação/conversão após revisão justificada de todas as partes por profissional autorizado; coincidências nominais usam apenas carteira visível e não decidem conflito automaticamente. Meu Dia abre automaticamente apenas quando há trabalho, direciona tarefas e prazos às fichas correspondentes, compromissos à agenda, e reúne pendências de revisão demonstrativas. A agenda cria compromissos locais com responsável/área/caso opcional e abre detalhes dos itens sem caso. A Caixa de Trabalho inclui rascunhos de comunicação aguardando revisão. Notificações podem ser adiadas por 24 horas e reativadas. Essas ações persistem apenas na demonstração local; não há sync, envio ou serviço externo.

A visibilidade demonstrativa dos casos exige atribuição individual ou concessão explícita ao papel, além do vínculo com o escritório. Documentos restritos exigem concessão própria; o acesso ao caso não basta. O cadastro pode selecionar arquivo local e persistir somente nome/tipo/tamanho fictícios, sem enviar ou armazenar bytes. A prévia de modelos preenche marcadores com cliente e caso visíveis, profissional e escritório atuais, lista campos pendentes e não gera nem salva arquivo. Listas de clientes seguem casos visíveis ou responsabilidade atual. Eventos de documento na atividade ficam vinculados a `docId` e seguem as mesmas concessões; registros sem vínculo não são exibidos. A prévia deriva o documento da lista permitida ao perfil atual, então desaparece se o acesso for revogado. A prévia também mostra proveniência e distingue captura original de interpretação fictícia sem calcular hash. A seleção exibe busca, vínculos ativos, pendente e suspenso; somente os ativos permitem entrada e a troca pede confirmação. Segurança da conta apresenta MFA, recuperação e sessões fictícias, com estados de erro e bloqueio; sair da demo limpa a seleção ativa. Primeiros passos usa roteiro guiado conforme o perfil. Endereços desconhecidos mostram estado 404 em português. As fichas de equipe e substituições exibem preparação de continuidade, aceite, retorno e pendências como interações locais. Prazos inclui painel de cobertura demonstrativa por fonte e período (DEC-134), revisão de divergências/correlações suspeitas (DEC-129–131), sem consulta externa, e propostas de alteração preservam a data vigente até revisão/aprovação humana (DEC-128). A ficha de tarefa permite anotações locais da equipe. Os menus refletem os guards das rotas e as validações dos formulários oferecem mensagens acessíveis; telas móveis quebram textos longos em cartões. No shell, o menu lateral desktop pode ser recolhido para 74 px, com estado salvo localmente; `Ctrl+K`/`⌘K` abre a busca global.

Na continuação de 06/11/2026, o cadastro de atendimento permite informar PF/PJ ou escolher cliente visível existente; converter atendimento reutiliza o vínculo e evita cliente duplicado, sem pular a revisão de conflitos. A criação e ficha de tarefas expõem solicitante, instruções, processo e compromisso; tarefas internas sem caso ficam limitadas ao responsável/solicitante e gestão, a conclusão exige revisão profissional e justificativa e a atividade também fica registrada em tarefas sem caso. Propostas e alterações de prazo usam data/hora no fuso IANA escolhido e exibem esse fuso na lista e na revisão.

A biblioteca de documentos aceita descrição e texto demonstrativo, cria snapshots de versão, permite envio justificado para revisão e aprovação com justificativa por outra pessoa profissional; modelos institucionais têm estado de rascunho/revisão/publicado, autoria, revisão por outra pessoa gestora/sócia e histórico de versões. A central de notificações cobre atribuição, menção, retorno de cliente, suporte e cobertura informativa, com destinatário demonstrativo e contexto filtrado pelo perfil; Meu Dia reúne retornos e cobertura a conferir. Solicitações de suporte podem incluir rota técnica sanitizada e, opcionalmente, referência codificada de caso visível mediante consentimento explícito; conteúdo jurídico e bytes de arquivo continuam fora do envio.

## Evidência de verificação

- Nesta continuação (2026-11-06), `npx tsc --noEmit` e `npm run build` passaram após as correções de jornada e da rota índice.
- O servidor local respondeu `/o/almeida-demonstracao` com redirect HTTP 307 para `/inicio`; `/inicio`, `/comunicacao`, `/agenda` e `/preferencias` responderam HTTP 200.
- ESLint direcionado aos arquivos desta rodada concluiu sem erros; permaneceu o aviso Fast Refresh preexistente nos exports do store. `git diff --check` passou, com avisos de conversão LF/CRLF do Git no Windows.
- `npm run build`: aprovado em 2026-11-06 após shell recolhível/atalho de busca, convites de equipe, revisão de conflitos, edição do perfil, agenda, metadados de arquivo e prévia de modelos.
- `npx tsc --noEmit`: aprovado em 2026-11-06 após os mesmos fluxos de demonstração.
- Nesta continuação: `npx tsc --noEmit` e `npm run build` passaram após os ajustes de atendimento PF/PJ, delegação e revisão de tarefas, documentos/modelos, prazos com fuso e notificações/suporte.
- `npx vitest run --maxWorkers=1`: 6 arquivos, 19 testes aprovados, incluindo isolamento entre escritórios, sigilo documental e sessões demonstrativas.
- ESLint direcionado a `src/components/office`, `src/features/demo` e `src/routes`, com regra Prettier desativada: aprovado.
- Rotas amostradas no servidor de desenvolvimento responderam HTTP 200. Inspeção responsiva com viewport CSS de 390 px confirmou largura de documento e conteúdo sem overflow horizontal em Início, criação de documento, detalhe de tarefa, Financeiro e Equipe; a captura do Início foi inspecionada.
- Na auditoria de 2026-11-06 contra as notas 06, 19, 20, 39 e 44: documentos com revisão pendente agora aparecem na Caixa de Trabalho e no Meu Dia, com link limitado ao documento visível/autorizado; a fila de atendimentos recorta por responsável, exceto para gestão; casos registram natureza explicitamente e não inferem isso pelo número de processos; financeiro grava previsões em centavos inteiros e deixou de exibir liquidação/pagamento.
- `npx tsc --noEmit` e `npm run build` passaram após essa auditoria. Não foram executados testes nem inspeção manual de cada fluxo e viewport nesta rodada.
- O cadastro direto de caso é rotulado como rascunho em análise e orienta novos potenciais clientes a passar primeiro por atendimento e revisão humana de conflitos.
- Continuação da auditoria contra Obsidian 39–46 e 57/65: Atendimentos recebeu busca, filtro por etapa e contagens; Casos recebeu filtro por natureza; Prazos recebeu busca, filtro de origem, filtro real Todos/Prazos/Compromissos e calendário mensal conjunto com contagens, seleção/limpeza de dia; Processos passou a aceitar cadastro independente de caso e CNJ opcional, com busca, filtro com/sem caso e ficha contextual; Meu Dia passou a usar os quatro indicadores de Clientes, Casos, Processos sem conferência oficial e Tarefas abertas, além de fila de atenção; a matriz de permissões agora enumera capacidades por papel; preferências de notificação afetam Central e Meu Dia; Relatórios está marcado como Conceito · Fase 2/P2.
- A implementação de processos aceita CNJ somente como formato demonstrativo: os registros continuam sem consulta oficial. `TimelineEvent` admite eventos de processo sem caso e a busca global abre a ficha correta do processo.
- Os layouts Stitch (61 telas) e o QA 61×4 citados nas notas 65/68/72/77 pertencem ao app independente na VPS, não a este checkout Lovable. Esse resultado não prova paridade visual aqui. Inspeção manual de todas as telas e QA responsivo integral do checkout atual continuam pendentes.
- Nesta continuação: `npx tsc --noEmit`, `npm run build` e `git diff --check` passaram. Não foram executados testes automatizados nem QA visual tela a tela.
- Nesta continuação, o cadastro direto também cria atendimento vinculado ao rascunho e verificações pendentes para cada parte relacionada; exige responsável profissional autorizado, e a conversão aprovada reutiliza o mesmo caso. Solicitante e responsável veem o atendimento, enquanto a gestão mantém acesso à fila do escritório. Atendimentos pendentes aparecem no Meu Dia e na Caixa de Trabalho, com links para a revisão.
- `npx tsc --noEmit`, `npm run build` e `git diff --check` passaram para esta continuação. Não foi feita inspeção manual de todos os fluxos/telas nesta rodada.

## O que ainda não está comprovado

A contagem de rotas deste Lovable **não equivale** às 61 telas Stitch do app separado da VPS. Não há neste repositório os 61 HTML originais, suas imagens de referência ou um manifesto de correspondência tela a tela. Portanto, paridade visual 61/61 e QA responsivo em todas as telas ainda precisam de comparação com os originais. Os dois domínios públicos documentados nos registros 71/72 responderam HTTP 404 na consulta mais recente da auditoria; não houve publicação nem alteração remota. O comando `npm run lint` completo falha por formatação/CRLF em arquivos preexistentes; o lint funcional direcionado passou. O build usa preset Cloudflare e gera `.output`; `npm run preview` não foi validado nesta rodada como servidor de prévia SSR para esse preset, então a inspeção local fica limitada ao servidor de desenvolvimento.

A autorização permanece uma simulação no navegador: a concessão por papel ao criar um caso pode alcançar outros usuários do mesmo papel. A arquitetura de autenticação, revogação e política no backend descrita nas decisões DEC-093 a DEC-096 não foi implementada neste repositório frontend-only.

## Continuação da auditoria — 2026-11-06

- A auditoria identificou que a busca global cobria somente casos, clientes e processos, e desabilitava clientes sem caso. A busca agora inclui atendimentos, tarefas, prazos e documentos visíveis, abre as fichas correspondentes e permite abrir o cadastro do cliente independentemente de vínculo com caso. As coleções vêm de `useOfficeView`; documentos e prazos mantêm os guards de perfil existentes.
- A matriz de permissões agora troca a tabela larga por cartões abaixo de `xl`, sem rolagem horizontal obrigatória em mobile/tablet.
- Verificação no Chromium local: navegação da busca para as sete categorias (casos, clientes, atendimentos, tarefas, prazos, documentos e processos) abriu a rota/ficha esperada. Em 390 px, 10 rotas representativas — início, atendimentos, casos, processos, prazos, tarefas, documentos, financeiro, permissões e perfil — não tiveram overflow no documento. Captura manual da matriz em 390 px confirmou leitura em cartões.
- A varredura ampla de 61 rotas × 4 viewports foi interrompida após a sessão local de CDP parar de responder e o processo exceder memória; por isso não se declara QA responsivo completo.
- A convenção de filtros/visualizações salvos da nota 19 segue sem interface neste checkout. É uma lacuna secundária/P2, distinta das rotas principais e da comparação visual ainda pendente.
- Os conectores do navegador da VPS recusaram acesso por reautenticação/HTTP 429 nesta rodada. O requisito de comparação visual com os 61 originais Stitch segue sem evidência neste checkout; os HTML e as capturas de referência continuam no app separado descrito nas notas 65/68/72/77.
- Busca global ampliada e cards da matriz foram verificados com `npx tsc --noEmit`, `npm run build` e `git diff --check` após a rodada.

