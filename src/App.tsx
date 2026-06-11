import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  History, 
  Plus, 
  Save, 
  Search, 
  Share2, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  Check, 
  UserPlus, 
  FileText, 
  BarChart2, 
  Copy, 
  Download, 
  Upload,
  UserCheck,
  UserMinus,
  Settings,
  HelpCircle,
  Clock,
  Briefcase,
  X,
  RefreshCw
} from 'lucide-react';
import { Separador, Lancamento, Turno, TurnoPadrao, StatusSeparador } from './types';
import { separadoresIniciais, lancamentosIniciais } from './dataDemo';

export default function App() {
  // --- ESTADOS DO SISTEMA ---
  const [separadores, setSeparadores] = useState<Separador[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [tabAtiva, setTabAtiva] = useState<'lancamento' | 'dashboard' | 'separadores' | 'historico'>('lancamento');
  
  // Toasts de Notificação
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  // --- CARREGAMENTO INICIAL DO LOCAL STORAGE ---
  useEffect(() => {
    const rawSep = localStorage.getItem('marsil_separadores');
    const rawLan = localStorage.getItem('marsil_lancamentos');

    if (rawSep) {
      setSeparadores(JSON.parse(rawSep));
    } else {
      localStorage.setItem('marsil_separadores', JSON.stringify(separadoresIniciais));
      setSeparadores(separadoresIniciais);
    }

    if (rawLan) {
      setLancamentos(JSON.parse(rawLan));
    } else {
      localStorage.setItem('marsil_lancamentos', JSON.stringify(lancamentosIniciais));
      setLancamentos(lancamentosIniciais);
    }
  }, []);

  // salvar no localStorage sempre que modificar
  const saveSeparadores = (novos: Separador[]) => {
    setSeparadores(novos);
    localStorage.setItem('marsil_separadores', JSON.stringify(novos));
  };

  const saveLancamentos = (novos: Lancamento[]) => {
    setLancamentos(novos);
    localStorage.setItem('marsil_lancamentos', JSON.stringify(novos));
  };

  // Exibir Toast helper
  const showToast = (mensagem: string, tipo: 'success' | 'error' | 'info' = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // obter data atual formatada YYYY-MM-DD
  const formatarDataISO = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const hojeISO = formatarDataISO(new Date());

  // --- ABA 1: ESTADOS DE LANÇAMENTO ---
  const [lancData, setLancData] = useState<string>(hojeISO);
  const [lancTurno, setLancTurno] = useState<Turno>('Tarde');
  const [buscaSeparador, setBuscaSeparador] = useState<string>('');
  const [separadorSelecionado, setSeparadorSelecionado] = useState<Separador | null>(null);
  const [lancQtd, setLancQtd] = useState<string>('');
  const [lancErros, setLancErros] = useState<number>(0);
  const [lancObs, setLancObs] = useState<string>('');
  const [dropdownAberto, setDropdownAberto] = useState<boolean>(false);
  
  // Estado para conflito de duplicação
  const [conflitoInfo, setConflitoInfo] = useState<{
    novoLancamento: Omit<Lancamento, 'id'>;
    registroExistente: Lancamento;
  } | null>(null);

  // Filtrar separadores ativos para o formulário de lançamento
  const separadoresAtivosFiltrados = useMemo(() => {
    return separadores.filter(s => 
      s.status === 'Ativo' && 
      (buscaSeparador === '' || s.nome.toLowerCase().includes(buscaSeparador.toLowerCase()))
    );
  }, [separadores, buscaSeparador]);

  // Lançamentos realizados na data selecionada (para a parte inferior da aba Lançamento Diário)
  const lancamentosDoDia = useMemo(() => {
    return lancamentos
      .filter(l => l.data === lancData)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [lancamentos, lancData]);

  // Submeter Lançamento Diário
  const handleSalvarLancamento = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!separadorSelecionado) {
      showToast('Selecione um separador válido!', 'error');
      return;
    }

    const qtdNum = Number(lancQtd);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      showToast('A quantidade deve ser um número inteiro maior que zero!', 'error');
      return;
    }

    // Preparar objeto de lançamento
    const novoReg: Omit<Lancamento, 'id'> = {
      data: lancData,
      turno: lancTurno,
      separadorId: separadorSelecionado.id,
      quantidade: Math.floor(qtdNum),
      erros: Math.abs(Math.floor(lancErros)),
      observacao: lancObs.trim(),
      createdAt: new Date().toISOString()
    };

    // Verificar duplicação (mesma data + mesmo turno + mesmo separador)
    const existente = lancamentos.find(l => 
      l.data === novoReg.data && 
      l.turno === novoReg.turno && 
      l.separadorId === novoReg.separadorId
    );

    if (existente) {
      // Abriu diálogo de conflito
      setConflitoInfo({ novoLancamento: novoReg, registroExistente: existente });
    } else {
      // Salvar normalmente
      const novoId = 'lan_' + Date.now();
      const novosLancamentos = [{ ...novoReg, id: novoId }, ...lancamentos];
      saveLancamentos(novosLancamentos);
      showToast('Lançamento registrado com sucesso!');
      limparFormularioLancamento();
    }
  };

  // Resolver duplicação por Soma
  const resolverComSoma = () => {
    if (!conflitoInfo) return;
    const { novoLancamento, registroExistente } = conflitoInfo;

    const novosLancamentos = lancamentos.map(l => {
      if (l.id === registroExistente.id) {
        return {
          ...l,
          quantidade: l.quantidade + novoLancamento.quantidade,
          erros: l.erros + novoLancamento.erros,
          observacao: [l.observacao, novoLancamento.observacao].filter(Boolean).join(' | ')
        };
      }
      return l;
    });

    saveLancamentos(novosLancamentos);
    showToast('Valores somados ao registro existente!');
    setConflitoInfo(null);
    limparFormularioLancamento();
  };

  // Resolver duplicação por Substituição
  const resolverComSubstituicao = () => {
    if (!conflitoInfo) return;
    const { novoLancamento, registroExistente } = conflitoInfo;

    const novosLancamentos = lancamentos.map(l => {
      if (l.id === registroExistente.id) {
        return {
          ...l,
          quantidade: novoLancamento.quantidade,
          erros: novoLancamento.erros,
          observacao: novoLancamento.observacao
        };
      }
      return l;
    });

    saveLancamentos(novosLancamentos);
    showToast('Registro substituído pelos novos dados!');
    setConflitoInfo(null);
    limparFormularioLancamento();
  };

  const limparFormularioLancamento = () => {
    setBuscaSeparador('');
    setSeparadorSelecionado(null);
    setLancQtd('');
    setLancErros(0);
    setLancObs('');
  };

  // Excluir lançamento rápido (aba 1 ou 4)
  const handleExcluirLancamento = (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento?')) {
      const novos = lancamentos.filter(l => l.id !== id);
      saveLancamentos(novos);
      showToast('Lançamento removido permanentemente.');
    }
  };


  // --- ABA 2: RANKING / DASHBOARD ---
  // Obter meses únicos disponíveis para filtro
  const mesesDisponiveis = useMemo(() => {
    const list = lancamentos.map(l => l.data.substring(0, 7)); // YYYY-MM
    // Garantir que o mês atual esteja contido, caso esteja vazio
    const mesAtualStr = hojeISO.substring(0, 7);
    if (!list.includes(mesAtualStr)) {
      list.push(mesAtualStr);
    }
    return Array.from(new Set(list)).sort((a: string, b: string) => b.localeCompare(a));
  }, [lancamentos, hojeISO]);

  // Estado dos Filtros do Dashboard
  const [dashMes, setDashMes] = useState<string>(hojeISO.substring(0, 7));
  const [dashTurno, setDashTurno] = useState<'Todos' | 'Tarde' | 'Noite'>('Todos');
  const [dashTurnoPodio, setDashTurnoPodio] = useState<'Tarde' | 'Noite'>('Tarde'); // Pódio exige distinção de turno
  const [ordenacaoCampo, setOrdenacaoCampo] = useState<string>('pontos');
  const [ordenacaoDirecao, setOrdenacaoDirecao] = useState<'asc' | 'desc'>('desc');

  // Lançamentos filtrados para o Dashboard (Mês e Turno aplicados)
  const lancamentosDoDashboard = useMemo(() => {
    return lancamentos.filter(l => {
      const correspondeMes = l.data.substring(0, 7) === dashMes;
      const correspondeTurno = dashTurno === 'Todos' || l.turno === dashTurno;
      return correspondeMes && correspondeTurno;
    });
  }, [lancamentos, dashMes, dashTurno]);

  // Separadores Ativos no Mês
  const separadoresAtivosNoMesCount = useMemo(() => {
    const ids = new Set(lancamentosDoDashboard.map(l => l.separadorId));
    return ids.size;
  }, [lancamentosDoDashboard]);

  // Métricas Consolidadas por Separador para o período (Mês selecionado)
  const classificacaoGeral = useMemo(() => {
    const consolidadoMap: Record<string, {
      separadorId: string;
      nome: string;
      turno: Turno;
      diasTrabalhados: Set<string>;
      totalSeparado: number;
      erros: number;
      pontos: number;
    }> = {};

    // Inicializar os separadores participantes do período para evitar furos de dados
    lancamentos.forEach(l => {
      // Filtrar lançamentos que combinam com o mês selecionado
      if (l.data.substring(0, 7) !== dashMes) return;
      
      // Aplicar filtro do turno geral se não for 'Todos'
      if (dashTurno !== 'Todos' && l.turno !== dashTurno) return;

      const sep = separadores.find(s => s.id === l.separadorId);
      if (!sep) return;

      const chave = `${l.separadorId}_${l.turno}`; // Agrupado por separador + turno para não juntar as métricas diferentes

      if (!consolidadoMap[chave]) {
        consolidadoMap[chave] = {
          separadorId: l.separadorId,
          nome: sep.nome,
          turno: l.turno,
          diasTrabalhados: new Set<string>(),
          totalSeparado: 0,
          erros: 0,
          pontos: 0
        };
      }

      consolidadoMap[chave].diasTrabalhados.add(l.data);
      consolidadoMap[chave].totalSeparado += l.quantidade;
      consolidadoMap[chave].erros += l.erros;
    });

    return Object.values(consolidadoMap).map(item => {
      const totalErros = item.erros;
      // pontos = quantidade separada − (erros × 2)
      const pontos = item.totalSeparado - (totalErros * 2);
      const dias = item.diasTrabalhados.size;
      const media = dias > 0 ? Number((item.totalSeparado / dias).toFixed(1)) : 0;

      return {
        ...item,
        diasTrabalhadosCount: dias,
        pontos,
        mediaDia: media
      };
    });
  }, [lancamentos, separadores, dashMes, dashTurno]);

  // Ordenação da Tabela Completa do Dashboard
  const classificacaoOdernada = useMemo(() => {
    const dados = [...classificacaoGeral];
    
    dados.sort((a, b) => {
      let valA: any = a[ordenacaoCampo as keyof typeof a];
      let valB: any = b[ordenacaoCampo as keyof typeof b];

      // Casos especiais de campos de objetos ou sets
      if (ordenacaoCampo === 'diasTrabalhados') {
        valA = a.diasTrabalhadosCount;
        valB = b.diasTrabalhadosCount;
      }

      if (typeof valA === 'string') {
        return ordenacaoDirecao === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // Se empatar a pontuação de ordenação principal na pontuação do ranking regular,
        // aplicar regras de desempate oficiais: menos erros, mais dias trabalhados
        if (ordenacaoCampo === 'pontos' && valA === valB) {
          if (a.erros !== b.erros) {
            return a.erros - b.erros; // menor erro ganha
          }
          return b.diasTrabalhadosCount - a.diasTrabalhadosCount; // maior dia ganha
        }

        return ordenacaoDirecao === 'asc' ? valA - valB : valB - valA;
      }
    });

    return dados;
  }, [classificacaoGeral, ordenacaoCampo, ordenacaoDirecao]);

  // TOP 5 Separadores por Turno (pódio de destaque)
  const rankingTardeTop5 = useMemo(() => {
    return classificacaoGeral
      .filter(item => item.turno === 'Tarde')
      .sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (a.erros !== b.erros) return a.erros - b.erros; // menor erro desempata
        return b.diasTrabalhadosCount - a.diasTrabalhadosCount; // maior dias desempata
      })
      .slice(0, 5);
  }, [classificacaoGeral]);

  const rankingNoiteTop5 = useMemo(() => {
    return classificacaoGeral
      .filter(item => item.turno === 'Noite')
      .sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (a.erros !== b.erros) return a.erros - b.erros;
        return b.diasTrabalhadosCount - a.diasTrabalhadosCount;
      })
      .slice(0, 5);
  }, [classificacaoGeral]);

  // Alterar campo de ordenação
  const handleOrdenar = (campo: string) => {
    if (ordenacaoCampo === campo) {
      setOrdenacaoDirecao(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacaoCampo(campo);
      setOrdenacaoDirecao('desc');
    }
  };

  // KPIs dos cards
  const kpis = useMemo(() => {
    let romaneiosCount = 0; // Tarde
    let pedidosCount = 0; // Noite
    let errosCount = 0;
    const diasComTrabalho = new Set<string>();

    lancamentosDoDashboard.forEach(l => {
      if (l.turno === 'Tarde') romaneiosCount += l.quantidade;
      if (l.turno === 'Noite') pedidosCount += l.quantidade;
      errosCount += l.erros;
      diasComTrabalho.add(l.data);
    });

    const diasTotais = diasComTrabalho.size || 1;
    const mediaGeralDiaria = Number(((romaneiosCount + pedidosCount) / diasTotais).toFixed(1));

    return {
      romaneios: romaneiosCount,
      pedidos: pedidosCount,
      erros: errosCount,
      mediaDiaria: mediaGeralDiaria,
      diasTrabalhados: diasTotais
    };
  }, [lancamentosDoDashboard]);


  // --- ESTADOS DO MODAL DO WHATSAPP ---
  const [whatsappTexto, setWhatsappTexto] = useState<string>('');
  const [isModalWhatappAberto, setIsModalWhatsappAberto] = useState<boolean>(false);

  // Gerar texto formatado para copiar para WhatsApp
  const handleGerarWhatsText = () => {
    const nomeMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const [ano, mes] = dashMes.split('-');
    const mNome = nomeMeses[parseInt(mes) - 1] || mes;

    let txt = `🏆 *RANKING SEPARADORES — MARSIL ROMANEIO* 🏆\n`;
    txt += `📅 *Mes de Referência: ${mNome} de ${ano}*\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // 1. Tarde Top 5
    txt += `🌅 *TURNO TARDE (Folhas de Romaneio)*\n`;
    if (rankingTardeTop5.length === 0) {
      txt += `_Nenhum lançamento neste turno no período._\n`;
    } else {
      rankingTardeTop5.forEach((item, idx) => {
        const medalha = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▪️';
        txt += `${medalha} *${idx + 1}º ${item.nome}* \n   ↳ *${item.pontos} pts* | ${item.totalSeparado} folhas | Erros: ${item.erros}\n`;
      });
    }

    txt += `\n🌃 *TURNO NOITE (Pedido a Pedido)*\n`;
    if (rankingNoiteTop5.length === 0) {
      txt += `_Nenhum lançamento neste turno no período._\n`;
    } else {
      rankingNoiteTop5.forEach((item, idx) => {
        const medalha = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▪️';
        txt += `${medalha} *${idx + 1}º ${item.nome}* \n   ↳ *${item.pontos} pts* | ${item.totalSeparado} pedidos | Erros: ${item.erros}\n`;
      });
    }

    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `💡 *Critérios:* Pontos = quantidade separada - (erros × 2).\n`;
    txt += `Desempates: Menos erros, mais dias trabalhados.\n`;
    txt += `📊 _Atualizado via Marsil Romaneio System em ${new Date().toLocaleDateString('pt-BR')}_`;

    setWhatsappTexto(txt);
    setIsModalWhatsappAberto(true);
  };

  const handleCopiarWhatsAppTexto = () => {
    navigator.clipboard.writeText(whatsappTexto).then(() => {
      showToast('Texto para WhatsApp copiado com sucesso!');
    }).catch(() => {
      showToast('Erro ao copiar texto automaticamente. Selecione e copie manualmente.', 'error');
    });
  };

  // Exportar dados do mês atual para CSV
  const handleExportarCSVMes = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Polição;Nome;Turno;Dias Trabalhados;Quantidade Separada;Erros;Pontos;Media por Dia\n';

    // Compilar classificações de ambos os turnos
    const compTarde = rankingTardeTop5; // Vamos colocar os da tarde primeiro, depois noite
    const compNoite = rankingNoiteTop5;

    compTarde.forEach((item, index) => {
      csvContent += `${index + 1};${item.nome};Tarde;${item.diasTrabalhadosCount};${item.totalSeparado};${item.erros};${item.pontos};${item.mediaDia}\n`;
    });
    compNoite.forEach((item, index) => {
      csvContent += `${index + 1};${item.nome};Noite;${item.diasTrabalhadosCount};${item.totalSeparado};${item.erros};${item.pontos};${item.mediaDia}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ranking_marsil_${dashMes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ranking exportado como CSV com sucesso!');
  };


  // --- ABA 3: CADASTRO E GESTÃO DE SEPARADORES ---
  const [sepNome, setSepNome] = useState<string>('');
  const [sepTurno, setSepTurno] = useState<TurnoPadrao>('Tarde');
  const [sepStatus, setSepStatus] = useState<StatusSeparador>('Ativo');
  const [sepEditId, setSepEditId] = useState<string | null>(null);

  // Cadastrar ou Editar Separador
  const handleSalvarSeparador = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sepNome.trim()) {
      showToast('O nome do separador é obrigatório!', 'error');
      return;
    }

    // Verificar se já existe separador com esse nome (evitar duplicações, exceto na própria edição)
    const nomeDuplicado = separadores.some(s => 
      s.nome.trim().toLowerCase() === sepNome.trim().toLowerCase() && s.id !== sepEditId
    );

    if (nomeDuplicado) {
      showToast(`Já existe um separador cadastrado com o nome "${sepNome}"!`, 'error');
      return;
    }

    if (sepEditId) {
      // Editando
      const atualizados = separadores.map(s => {
        if (s.id === sepEditId) {
          return { ...s, nome: sepNome.trim(), turnoPadrao: sepTurno, status: sepStatus };
        }
        return s;
      });
      saveSeparadores(atualizados);
      showToast('Dados do separador atualizados no sistema!');
      setSepEditId(null);
    } else {
      // Novo cadastro
      const novo: Separador = {
        id: 'sep_' + Date.now(),
        nome: sepNome.trim(),
        turnoPadrao: sepTurno,
        status: 'Ativo' // Sempre inicia como Ativo
      };
      saveSeparadores([...separadores, novo]);
      showToast(`Separador "${novo.nome}" cadastrado com sucesso!`);
    }

    setSepNome('');
    setSepTurno('Tarde');
    setSepStatus('Ativo');
  };

  // Preparar edição de Separador
  const iniciarEdicaoSeparador = (s: Separador) => {
    setSepEditId(s.id);
    setSepNome(s.nome);
    setSepTurno(s.turnoPadrao);
    setSepStatus(s.status);
    // Rola de volta para o form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verificar se o separador tem histórico (para travar exclusão)
  const separadorTemHistorico = (id: string) => {
    return lancamentos.some(l => l.separadorId === id);
  };

  // Excluir ou alertar inativação de Separador
  const handleExcluirSeparador = (s: Separador) => {
    if (separadorTemHistorico(s.id)) {
      showToast('Este separador possui histórico de lançamentos. Inative-o em vez de excluir.', 'error');
      return;
    }

    if (confirm(`Deseja realmente remover o separador "${s.nome}" do sistema?`)) {
      const novos = separadores.filter(item => item.id !== s.id);
      saveSeparadores(novos);
      showToast(`Separador "${s.nome}" excluído do sistema.`);
    }
  };

  // Alternar Status rápido de ativo/inativo na tabela
  const alternarStatusSeparadorDirect = (s: Separador) => {
    const novoStatus: StatusSeparador = s.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const novos = separadores.map(item => {
      if (item.id === s.id) {
        return { ...item, status: novoStatus };
      }
      return item;
    });
    saveSeparadores(novos);
    showToast(`O separador "${s.nome}" está agora ${novoStatus.toLowerCase()}`);
  };


  // --- ABA 4: HISTÓRICO COMPLETO ---
  // Filtros Histórico
  const [histFiltroDe, setHistFiltroDe] = useState<string>('');
  const [histFiltroAte, setHistFiltroAte] = useState<string>('');
  const [histFiltroSeparador, setHistFiltroSeparador] = useState<string>('Todos');
  const [histFiltroTurno, setHistFiltroTurno] = useState<string>('Todos');
  
  // Estado para Edição do Lançamento no Modal
  const [lanEditando, setLanEditando] = useState<Lancamento | null>(null);

  // Lançamentos filtrados do Histórico
  const lancamentosFiltradosHistorico = useMemo(() => {
    return lancamentos.filter(l => {
      const atendeDe = !histFiltroDe || l.data >= histFiltroDe;
      const atendeAte = !histFiltroAte || l.data <= histFiltroAte;
      const atendeSeparador = histFiltroSeparador === 'Todos' || l.separadorId === histFiltroSeparador;
      const atendeTurno = histFiltroTurno === 'Todos' || l.turno === histFiltroTurno;

      return atendeDe && atendeAte && atendeSeparador && atendeTurno;
    }).sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
  }, [lancamentos, histFiltroDe, histFiltroAte, histFiltroSeparador, histFiltroTurno]);

  // Salvar alteração do Lançamento Editado
  const handleAtualizarLancamentoEditado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lanEditando) return;

    if (lanEditando.quantidade <= 0) {
      showToast('A quantidade deve ser maior que 0!', 'error');
      return;
    }

    const novos = lancamentos.map(l => {
      if (l.id === lanEditando.id) {
        return {
          ...lanEditando,
          quantidade: Math.floor(lanEditando.quantidade),
          erros: Math.floor(lanEditando.erros),
          observacao: lanEditando.observacao?.trim()
        };
      }
      return l;
    });

    saveLancamentos(novos);
    showToast('Lançamento corrigido com sucesso!');
    setLanEditando(null);
  };

  // Exportar Tudo em CSV
  const handleExportarTudoCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Data;Turno;SeparadorID;Nome Separador;Quantidade;Erros;Pontos;Observação\n';

    lancamentos.forEach(l => {
      const sep = separadores.find(s => s.id === l.separadorId);
      const sepNomeStr = sep ? sep.nome : 'Desconhecido';
      const pts = l.quantidade - (l.erros * 2);
      const dataFormat = l.data.split('-').reverse().join('/');
      csvContent += `${dataFormat};${l.turno};${l.separadorId};${sepNomeStr};${l.quantidade};${l.erros};${pts};"${l.observacao || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'backup_lancamentos_marsil.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Histórico completo baixado em CSV!');
  };

  // Exportar Backup JSON estruturado
  const handleDownloadBackupJSON = () => {
    const dataObj = {
      exportadoEm: new Date().toISOString(),
      versao: '1.0',
      separadores: separadores,
      lancamentos: lancamentos
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `backup_ranking_marsil_${hojeISO}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup do banco de dados (JSON) baixado!');
  };

  // Importar JSON
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        // Validação básica do formato do arquivo
        if (!backupData.separadores || !backupData.lancamentos) {
          showToast('Arquivo JSON inválido! Chaves separadores/lancamentos não encontradas.', 'error');
          return;
        }

        if (confirm(`Atenção: Ao restaurar, você irá MESCLAR as informações atuais com o arquivo importado. Deseja prosseguir?`)) {
          // Filtrar duplicados ao importar separadores
          const mapSepAtuais = new Map(separadores.map(s => [s.id, s]));
          const novosSeps = [...separadores];
          let sepsImportados = 0;

          backupData.separadores.forEach((s: Separador) => {
            if (!mapSepAtuais.has(s.id)) {
              novosSeps.push(s);
              sepsImportados++;
            } else {
              // Atualizar se for o caso
              const index = novosSeps.findIndex(item => item.id === s.id);
              if (index !== -1) novosSeps[index] = s;
            }
          });

          // Filtrar lançamentos duplicados
          const mapLanAtuais = new Map(lancamentos.map(l => [l.id, l]));
          const novosLans = [...lancamentos];
          let lansImportados = 0;

          backupData.lancamentos.forEach((l: Lancamento) => {
            if (!mapLanAtuais.has(l.id)) {
              novosLans.push(l);
              lansImportados++;
            } else {
              // Atualizar se existir
              const index = novosLans.findIndex(item => item.id === l.id);
              if (index !== -1) novosLans[index] = l;
            }
          });

          saveSeparadores(novosSeps);
          saveLancamentos(novosLans);

          showToast(`Backup restaurado! ${sepsImportados} separadores e ${lansImportados} lançamentos importados/atualizados.`);
        }
      } catch (err) {
        showToast('Erro ao ler ou processar o arquivo JSON!', 'error');
      }
    };
    reader.readAsText(file);
    // Resetar input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // --- GRÁFICOS SVG DINÂMICOS (CUSTOMIZADOS E ALTAMENTE INTERATIVOS) ---

  // Dados filtrados do Gráfico 1: Top 10 por Pontuação no Mês
  const dadosGraficoTop10 = useMemo(() => {
    // Escolhe turno conforme pódio ativo do dash ou ambos amalgamados
    const base = classificacaoGeral
      .filter(item => dashTurno === 'Todos' ? item.turno === dashTurnoPodio : item.turno === dashTurno)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 10);

    const maxPontos = Math.max(...base.map(b => b.pontos), 1);

    return base.map(item => ({
      nome: item.nome.split(' ').slice(0, 2).join(' '), // Pegar apenas nome e primeiro sobrenome
      pontos: item.pontos,
      totalSeparado: item.totalSeparado,
      erros: item.erros,
      porcentagem: (item.pontos / maxPontos) * 100
    }));
  }, [classificacaoGeral, dashTurno, dashTurnoPodio]);

  // Dados filtrados do Gráfico 2: Evolução Diária das Separações no Mês
  const dadosEvolucaoDiaria = useMemo(() => {
    const datasNoMes: Record<string, { Tarde: number; Noite: number }> = {};
    
    // Pegar todos os dias que tiveram lançamentos no mês filtrado
    lancamentos.forEach(l => {
      if (l.data.substring(0, 7) !== dashMes) return;
      const diaStr = l.data.substring(8, 10); // DD
      
      if (!datasNoMes[diaStr]) {
        datasNoMes[diaStr] = { Tarde: 0, Noite: 0 };
      }
      
      if (l.turno === 'Tarde') {
        datasNoMes[diaStr].Tarde += l.quantidade;
      } else {
        datasNoMes[diaStr].Noite += l.quantidade;
      }
    });

    const ordenadoPorDia = Object.entries(datasNoMes)
      .map(([dia, valores]) => ({
        dia: `Dia ${dia}`,
        diaNum: parseInt(dia),
        Tarde: valores.Tarde,
        Noite: valores.Noite
      }))
      .sort((a, b) => a.diaNum - b.diaNum);

    const maxTarde = Math.max(...ordenadoPorDia.map(o => o.Tarde), 1);
    const maxNoite = Math.max(...ordenadoPorDia.map(o => o.Noite), 1);

    return {
      pontos: ordenadoPorDia,
      maxTarde,
      maxNoite
    };
  }, [lancamentos, dashMes]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1419] text-[#e1e8ed] font-sans selection:bg-[#ff6b35]/30">
      
      {/* ─── CABEÇALHO PRINCIPAL (HIGH DENSITY) ─── */}
      <header className="border-b-[2px] border-[#2d3742] bg-[#0f1419] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 h-auto sm:h-[60px] py-1 sm:py-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#ff6b35] flex items-center justify-center font-bold text-white text-md shadow-md shadow-[#ff6b35]/20">
              MR
            </div>
            <div className="text-md sm:text-lg font-bold text-[#ff6b35] tracking-tight whitespace-nowrap">
              Ranking Separadores <span className="text-[#8899a6] text-xs font-semibold">· Marsil Romaneio</span>
            </div>
          </div>

          {/* Abas Superiores */}
          <nav className="flex items-stretch gap-1 sm:h-[58px] select-none py-1 sm:py-0">
            {[
              { id: 'lancamento', label: 'Lançamento Diário', icon: Calendar },
              { id: 'dashboard', label: 'Ranking / Dashboard', icon: TrendingUp },
              { id: 'separadores', label: 'Separadores', icon: Users },
              { id: 'historico', label: 'Histórico', icon: History }
            ].map(tab => {
              const Icon = tab.icon;
              const ativa = tabAtiva === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setTabAtiva(tab.id as any)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-0 text-xs sm:text-sm font-semibold border-b-[3px] transition-all cursor-pointer h-full ${
                    ativa 
                      ? 'text-[#ff6b35] border-[#ff6b35] bg-[#ff6b35]/[0.05]' 
                      : 'text-[#8899a6] border-transparent hover:text-white hover:bg-[#1a2129]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ─── TOAST DE NOTIFICAÇÃO ─── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded bg-[#1a2129] border border-[#2d3742] shadow-2xl animate-fade-in">
          <div className={`w-2 h-2 rounded-full ${
            toast.tipo === 'success' ? 'bg-[#00b87c]' : toast.tipo === 'error' ? 'bg-[#ff3b30]' : 'bg-[#38bdf8]'
          }`} />
          <span className="text-xs font-semibold text-white">{toast.mensagem}</span>
        </div>
      )}

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:p-5">
        
        {/* ==============================================
             ABA 1: LANÇAMENTO DIÁRIO (HIGH DENSITY)
           ============================================== */}
        {tabAtiva === 'lancamento' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
            {/* Bloco do Form (Esquerda) */}
            <div className="lg:col-span-7 bg-[#1a2129] border border-[#2d3742] rounded p-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2d3742]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-[#ff6b35]" />
                  <h2 className="text-sm sm:text-md font-bold text-white uppercase tracking-wider">Novo Lançamento</h2>
                </div>
                <span className="text-[10px] text-[#8899a6] font-medium font-mono">MARSIL ROMANEIO</span>
              </div>

              <form onSubmit={handleSalvarLancamento} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Data */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-1">Data</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={lancData}
                        onChange={(e) => setLancData(e.target.value)}
                        className="w-full bg-[#0f1419] border border-[#2d3742] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                        required
                      />
                    </div>
                  </div>

                  {/* Turno */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-1">Turno</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#0f1419] p-1 border border-[#2d3742] rounded">
                      <button
                        type="button"
                        onClick={() => { setLancTurno('Tarde'); limparFormularioLancamento(); }}
                        className={`py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                          lancTurno === 'Tarde' 
                            ? 'bg-[#ff6b35] text-white' 
                            : 'text-[#8899a6] hover:text-white'
                        }`}
                      >
                        Tarde (Folhas)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLancTurno('Noite'); limparFormularioLancamento(); }}
                        className={`py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                          lancTurno === 'Noite' 
                            ? 'bg-[#ff6b35] text-white' 
                            : 'text-[#8899a6] hover:text-white'
                        }`}
                      >
                        Noite (Pedidos)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dropdown de Separadores com Autocomplete */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-1">
                    Separador <span className="text-[#ff6b35]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8899a6]">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Pesquisar separador..."
                      value={separadorSelecionado ? separadorSelecionado.nome : buscaSeparador}
                      onChange={(e) => {
                        setBuscaSeparador(e.target.value);
                        setSeparadorSelecionado(null);
                        setDropdownAberto(true);
                      }}
                      onFocus={() => setDropdownAberto(true)}
                      className="w-full bg-[#0f1419] border border-[#2d3742] rounded pl-8 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                    />
                    {separadorSelecionado && (
                      <button
                        type="button"
                        onClick={() => {
                          setSeparadorSelecionado(null);
                          setBuscaSeparador('');
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8899a6] hover:text-[#ff3b30]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Lista */}
                  {dropdownAberto && !separadorSelecionado && (
                    <div className="absolute z-50 w-full mt-1 bg-[#1a2129] border border-[#2d3742] rounded shadow-2xl max-h-48 overflow-y-auto">
                      {separadoresAtivosFiltrados.length === 0 ? (
                        <div className="p-2.5 text-[11px] text-[#8899a6] text-center">
                          Nenhum separador ativo encontrado.
                        </div>
                      ) : (
                        separadoresAtivosFiltrados.map(s => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              setSeparadorSelecionado(s);
                              setDropdownAberto(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#2d3742] text-xs text-white border-b border-[#2d3742]/30 flex items-center justify-between"
                          >
                            <span>{s.nome}</span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#0f1419] text-[#ff6b35]">
                              {s.turnoPadrao}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Quantidade Separada */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={lancTurno === 'Tarde' ? 'Ex: 15 folhas' : 'Ex: 45 pedidos'}
                      value={lancQtd}
                      onChange={(e) => setLancQtd(e.target.value)}
                      className="w-full bg-[#0f1419] border border-[#2d3742] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                      required
                    />
                  </div>

                  {/* Erros/Ocorrências */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-1">
                      Quantidade Erros
                    </label>
                    <div className="flex items-center bg-[#0f1419] border border-[#2d3742] rounded">
                      <button
                        type="button"
                        onClick={() => setLancErros(prev => Math.max(0, prev - 1))}
                        className="px-2.5 py-1 text-[#8899a6] hover:text-[#ff3b30] border-r border-[#2d3742] cursor-pointer font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={lancErros}
                        onChange={(e) => setLancErros(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-transparent text-center py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setLancErros(prev => prev + 1)}
                        className="px-2.5 py-1 text-[#8899a6] hover:text-[#00b87c] border-l border-[#2d3742] cursor-pointer font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-1">Observações (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Troca de código, falta faturamento"
                    value={lancObs}
                    onChange={(e) => setLancObs(e.target.value)}
                    maxLength={100}
                    className="w-full bg-[#0f1419] border border-[#2d3742] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ff6b35] hover:bg-[#e0531f] text-white font-bold rounded py-2 px-4 text-xs transition-colors flex items-center justify-center gap-1.5 mt-2 shadow-md cursor-pointer uppercase tracking-wider"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Lançamento
                </button>
              </form>
            </div>

            {/* Lista de Lançamentos do Dia Selecionado (Direita) */}
            <div className="lg:col-span-5 bg-[#1a2129] border border-[#2d3742] rounded p-4 flex flex-col h-auto max-h-[480px]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2d3742]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-[#8899a6]" />
                  <h3 className="text-xs sm:text-xs font-bold text-white uppercase tracking-wider">
                    Lançamentos Digitados
                  </h3>
                </div>
                <span className="text-[10px] bg-[#0f1419] border border-[#2d3742] px-2 py-0.5 rounded font-mono font-bold text-[#ff6b35]">{lancamentosDoDia.length}</span>
              </div>

              {/* Tabela Rápida */}
              <div className="flex-1 overflow-y-auto pr-1">
                {lancamentosDoDia.length === 0 ? (
                  <div className="text-center py-16 text-[#8899a6]">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-35" />
                    <p className="text-[11px]">Nenhum lançamento digitado para esta data ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lancamentosDoDia.map(l => {
                      const sep = separadores.find(s => s.id === l.separadorId);
                      return (
                        <div 
                          key={l.id} 
                          className="p-2.5 rounded bg-[#0f1419] border border-[#2d3742] hover:border-[#ff6b35]/20 hover:bg-[#161d24] transition-all flex items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {sep ? sep.nome : 'Desconhecido'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8899a6]">
                              <span className={`badge ${
                                l.turno === 'Tarde' ? 'badge-tarde' : 'badge-noite'
                              }`}>
                                {l.turno === 'Tarde' ? 'TARDE_FOLHAS' : 'NOITE_PEDIDOS'}
                              </span>
                              <span>Qtd: <strong className="text-white font-bold">{l.quantidade}</strong></span>
                              {l.erros > 0 && (
                                <span className="text-[#ff3b30] font-bold">E: {l.erros}</span>
                              )}
                            </div>
                            {l.observacao && (
                              <p className="text-[9px] text-orange-400 italic mt-0.5 truncate">
                                "{l.observacao}"
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleExcluirLancamento(l.id)}
                            className="text-[#8899a6] hover:text-[#ff3b30] p-1 rounded hover:bg-[#ff3b30]/10 transition-colors cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
             ABA 2: RANKING / DASHBOARD 
           ============================================== */}
        {tabAtiva === 'dashboard' && (
          <div className="space-y-4 animate-fade-in">
            {/* Bloco de Filtros Consolidados */}
            <div className="bg-[#1a2129] border border-[#2d3742] rounded bg-[#1a2129] p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Filtro de Mês/Ano */}
                <div className="flex items-center gap-1.5 bg-[#0f1419] px-2.5 py-1 rounded border border-[#2d3742]">
                  <Calendar className="w-3.5 h-3.5 text-[#ff6b35]" />
                  <select
                    value={dashMes}
                    onChange={(e) => setDashMes(e.target.value)}
                    className="bg-transparent text-xs text-white border-0 outline-none pr-1 font-bold cursor-pointer"
                  >
                    {mesesDisponiveis.map(mes => {
                      const [anoVal, mesVal] = mes.split('-');
                      const nomesMeses = [
                        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                      ];
                      const dataLabel = `${nomesMeses[parseInt(mesVal) - 1]} / ${anoVal}`;
                      return (
                        <option key={mes} value={mes} className="bg-[#1a2129] text-white">
                          {dataLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Filtro de Turno */}
                <div className="flex bg-[#0f1419] p-0.5 border border-[#2d3742] rounded">
                  {['Todos', 'Tarde', 'Noite'].map((turnoOp) => (
                    <button
                      key={turnoOp}
                      onClick={() => setDashTurno(turnoOp as any)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        dashTurno === turnoOp 
                          ? 'bg-[#ff6b35] text-white shadow-sm' 
                          : 'text-[#8899a6] hover:text-white'
                      }`}
                    >
                      {turnoOp === 'Todos' ? 'TODOS' : turnoOp === 'Tarde' ? 'TARDE_ROMANEIO' : 'NOITE_PEDIDOS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Exportação */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleGerarWhatsText}
                  className="flex items-center justify-center gap-1.5 bg-green-600/15 hover:bg-green-600/25 text-green-400 font-bold text-[10px] py-1.5 px-3 rounded border border-green-500/25 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleExportarCSVMes}
                  className="flex items-center justify-center gap-1.5 bg-[#ff6b35]/15 hover:bg-[#ff6b35]/25 text-[#ff6b35] font-bold text-[10px] py-1.5 px-3 rounded border border-[#ff6b35]/25 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* KPIs Cards (HIGH DENSITY) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Total Produzido */}
              <div className="bg-white/[0.03] border border-[#2d3742] p-3 rounded flex items-center justify-between">
                <div>
                  <label className="text-[9px] font-bold text-[#8899a6] uppercase tracking-wider block">
                    {dashTurno === 'Tarde' ? 'Total Romaneios' : dashTurno === 'Noite' ? 'Total Pedidos' : 'Total Separado'}
                  </label>
                  {dashTurno === 'Todos' ? (
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs font-bold text-white">
                      <span>{kpis.romaneios} <span className="text-[9px] text-[#8899a6] font-medium font-mono">TARDE</span></span>
                      <span>{kpis.pedidos} <span className="text-[9px] text-[#8899a6] font-medium font-mono">NOITE</span></span>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base font-extrabold text-[#e1e8ed] mt-0.5">
                      {dashTurno === 'Tarde' ? kpis.romaneios : kpis.pedidos}
                      <span className="text-[10px] font-bold text-[#8899a6] ml-1 uppercase font-mono">
                        {dashTurno === 'Tarde' ? 'Folhas' : 'Pedidos'}
                      </span>
                    </p>
                  )}
                </div>
                <div className="w-7 h-7 rounded bg-[#ff6b35]/15 flex items-center justify-center text-[#ff6b35] hidden sm:flex">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 2: Separadores Ativos */}
              <div className="bg-white/[0.03] border border-[#2d3742] p-3 rounded flex items-center justify-between">
                <div>
                  <label className="text-[9px] font-bold text-[#8899a6] uppercase tracking-wider block">Separadores Ativos</label>
                  <p className="text-sm sm:text-base font-extrabold text-[#e1e8ed] mt-0.5">
                    {separadoresAtivosNoMesCount}
                    <span className="text-[#8899a6] text-[9px] font-bold ml-1 font-mono">TRABALHANDO</span>
                  </p>
                </div>
                <div className="w-7 h-7 rounded bg-emerald-500/15 flex items-center justify-center text-emerald-400 hidden sm:flex">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 3: Ocorrências */}
              <div className="bg-white/[0.03] border border-[#2d3742] p-3 rounded flex items-center justify-between">
                <div>
                  <label className="text-[9px] font-bold text-[#8899a6] uppercase tracking-wider block">Total Erros</label>
                  <p className={`text-sm sm:text-base font-extrabold mt-0.5 ${kpis.erros > 0 ? 'text-[#ff3b30]' : 'text-[#e1e8ed]'}`}>
                    {kpis.erros}
                    <span className="text-[9px] font-bold text-[#8899a6] ml-1 font-mono">APONTADOS</span>
                  </p>
                </div>
                <div className={`w-7 h-7 rounded flex items-center justify-center hidden sm:flex ${
                  kpis.erros > 0 ? 'bg-[#ff3b30]/15 text-[#ff3b30]' : 'bg-zinc-500/15 text-[#8899a6]'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 4: Média Diária */}
              <div className="bg-white/[0.03] border border-[#2d3742] p-3 rounded flex items-center justify-between">
                <div>
                  <label className="text-[9px] font-bold text-[#8899a6] uppercase tracking-wider block">Média Produção</label>
                  <p className="text-sm sm:text-base font-extrabold text-[#e1e8ed] mt-0.5">
                    {kpis.mediaDiaria}
                    <span className="text-[9px] font-bold text-[#8899a6] ml-1 font-mono">/ DIA</span>
                  </p>
                </div>
                <div className="w-7 h-7 rounded bg-indigo-500/15 flex items-center justify-center text-indigo-400 hidden sm:flex">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Destaque Visual PODIO TOP 5 (HIGH DENSITY) */}
            <div className="bg-[#1a2129] border border-[#2d3742] rounded p-4 shadow-md">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 pb-2 border-b border-[#2d3742]">
                <div className="flex items-center gap-2">
                  <span className="text-[#ff6b35] text-base">🏆</span>
                  <h3 className="text-xs sm:text-xs font-bold text-white uppercase tracking-wider">Destaques TOP 5 (Mensais)</h3>
                </div>
                
                {/* Seletor de turno exclusivo para o Pódio do Top 5 */}
                {dashTurno === 'Todos' && (
                  <div className="flex bg-[#0f1419] p-0.5 border border-[#2d3742] rounded">
                    <button
                      type="button"
                      onClick={() => setDashTurnoPodio('Tarde')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        dashTurnoPodio === 'Tarde' 
                          ? 'bg-[#ff6b35] text-white' 
                          : 'text-[#8899a6] hover:text-white'
                      }`}
                    >
                      🌅 TARDE
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashTurnoPodio('Noite')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        dashTurnoPodio === 'Noite' 
                          ? 'bg-[#ff6b35] text-white' 
                          : 'text-[#8899a6] hover:text-white'
                      }`}
                    >
                      🌃 NOITE
                    </button>
                  </div>
                )}
              </div>

              {/* Renderizar pódio do turno selecionado */}
              {(() => {
                const podioData = dashTurno === 'Todos' 
                  ? (dashTurnoPodio === 'Tarde' ? rankingTardeTop5 : rankingNoiteTop5)
                  : (dashTurno === 'Tarde' ? rankingTardeTop5 : rankingNoiteTop5);

                if (podioData.length === 0) {
                  return (
                    <div className="text-center py-6 text-[#8899a6] text-xs">
                      Nenhum lançamento no turno selecionado.
                    </div>
                  );
                }

                // Separar em 🥇 🥈 🥉 🌟
                const primeiro = podioData[0];
                const segundo = podioData[1];
                const terceiro = podioData[2];
                const resto = podioData.slice(3);

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                    
                    {/* Visual de Colunas de Pódio (Esquerda: 7 colunas) */}
                    <div className="lg:col-span-7 flex flex-col items-center justify-end py-2">
                      <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-2 items-end pt-5">
                        
                        {/* 🥈 Segundo Lugar */}
                        {segundo ? (
                          <div className="flex flex-col items-center group">
                            <div className="text-[11px] font-bold text-center text-[#8899a6] mb-1 truncate max-w-[95px]" title={segundo.nome}>
                              {segundo.nome.split(' ')[0]}
                            </div>
                            <div className="bg-[#1a2129] border border-[#2d3742] rounded p-2 flex flex-col items-center w-full shadow-sm">
                              <span className="text-xl mb-0.5">🥈</span>
                              <span className="text-xs font-black text-white">{segundo.pontos}</span>
                              <span className="text-[9px] text-[#8899a6] font-semibold font-mono">{segundo.totalSeparado} Qtd</span>
                            </div>
                            <div className="bg-[#2d3742] w-full h-16 rounded-t mt-0.5 flex flex-col items-center justify-center border-t border-slate-500/20">
                              <span className="font-extrabold text-slate-300 text-sm">2º</span>
                              <span className="text-[8px] text-slate-400 font-bold uppercase">LUGAR</span>
                            </div>
                          </div>
                        ) : <div className="h-16" />}

                        {/* 🥇 Primeiro Lugar */}
                        {primeiro ? (
                          <div className="flex flex-col items-center group relative -top-2">
                            <div className="absolute -top-6 animate-pulse text-lg">👑</div>
                            <div className="text-[11px] font-extrabold text-center text-[#ff6b35] mb-1 truncate max-w-[100px]" title={primeiro.nome}>
                              {primeiro.nome.split(' ')[0]}
                            </div>
                            <div className="bg-[#1a2129] border border-[#ff6b35]/40 rounded p-2 flex flex-col items-center w-full shadow-md">
                              <span className="text-2xl mb-0.5">🥇</span>
                              <span className="text-sm font-black text-[#ff6b35]">{primeiro.pontos}</span>
                              <span className="text-[9px] text-orange-400 font-semibold font-mono">{primeiro.totalSeparado} Qtd</span>
                            </div>
                            <div className="bg-gradient-to-t from-[#ff6b35] to-[#ff8c5a] w-full h-24 rounded-t mt-0.5 flex flex-col items-center justify-center shadow-lg border-t border-white/20">
                              <span className="font-black text-white text-lg">1º</span>
                              <span className="text-[8px] text-white/90 font-black tracking-wider uppercase">CAMPEÃO</span>
                            </div>
                          </div>
                        ) : <div className="h-24" />}

                        {/* 🥉 Terceiro Lugar */}
                        {terceiro ? (
                          <div className="flex flex-col items-center group">
                            <div className="text-[11px] font-bold text-center text-[#8899a6] mb-1 truncate max-w-[95px]" title={terceiro.nome}>
                              {terceiro.nome.split(' ')[0]}
                            </div>
                            <div className="bg-[#1a2129] border border-[#2d3742] rounded p-2 flex flex-col items-center w-full shadow-sm">
                              <span className="text-xl mb-0.5">🥉</span>
                              <span className="text-xs font-black text-white">{terceiro.pontos}</span>
                              <span className="text-[9px] text-[#8899a6] font-semibold font-mono">{terceiro.totalSeparado} Qtd</span>
                            </div>
                            <div className="bg-[#242c35] w-full h-12 rounded-t mt-0.5 border-t border-[#2d3742]/50 flex flex-col items-center justify-center">
                              <span className="font-extrabold text-slate-400 text-xs">3º</span>
                              <span className="text-[8px] text-[#8899a6] font-bold uppercase">LUGAR</span>
                            </div>
                          </div>
                        ) : <div className="h-12" />}

                      </div>
                    </div>

                    {/* Menções Honrosas 4º e 5º (Direita: 5 colunas) */}
                    <div className="lg:col-span-5 space-y-2 pb-2">
                      <h4 className="text-[10px] font-bold text-[#8899a6] uppercase tracking-wider mb-2">Posições Top 4º e 5º</h4>
                      
                      {resto.length === 0 ? (
                        <div className="p-2.5 text-[10px] italic text-[#8899a6] text-center border border-[#2d3742] border-dashed rounded font-mono">
                          SEM REGISTROS ADICIONAIS
                        </div>
                      ) : (
                        resto.map((item, idx) => (
                          <div 
                            key={item.separadorId} 
                            className="bg-[#0f1419] border border-[#2d3742] rounded p-2 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-white font-black bg-[#161a22] w-5 h-5 rounded flex items-center justify-center border border-[#2d3742]">
                                {idx + 4}º
                              </span>
                              <div>
                                <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{item.nome}</p>
                                <p className="text-[9px] text-[#8899a6] font-mono">DIAS: {item.diasTrabalhadosCount} • ERROS: {item.erros}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-[#ff6b35] block">{item.pontos} pts</span>
                              <span className="text-[8px] text-[#8899a6] font-mono block uppercase">{item.totalSeparado} {item.turno === 'Tarde' ? 'Folhas' : 'Pedidos'}</span>
                            </div>
                          </div>
                        ))
                      )}

                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SEÇÃO DE GRÁFICOS (CUSTOM SVG INTERATIVO PREMIUM) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico 1: Top 10 por Pontos (HIGH DENSITY) */}
              <div className="bg-[#1a2129] border border-[#2d3742] rounded p-4 flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#ff6b35]" />
                    Top 10 Separadores por Pontos
                  </h3>
                  <span className="text-[10px] font-mono text-[#8a99a6]">
                    Métricas de {dashTurno === 'Todos' ? (dashTurnoPodio === 'Tarde' ? 'Tarde' : 'Noite') : dashTurno}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
                  {dadosGraficoTop10.length === 0 ? (
                    <div className="text-center my-auto py-12 text-[#8a99a6]">
                      <p className="text-xs">Não existem dados para plotagem das pontuações.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 my-auto">
                      {dadosGraficoTop10.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-6 text-xs text-[#8a99a6] font-mono font-black text-right">{index + 1}º</span>
                          <div className="w-20 sm:w-28 text-xs text-white truncate font-medium text-left">
                            {item.nome}
                          </div>
                          <div className="flex-1 bg-[#0f1419] h-5 rounded-md overflow-hidden relative border border-[#2d3742] flex items-center">
                            <div 
                              className="bg-gradient-to-r from-[#ff6b35]/40 to-[#ff6b35] h-full rounded-l-md transition-all duration-700" 
                              style={{ width: `${item.porcentagem}%` }}
                            />
                            <span className="absolute left-2.5 text-[10px] font-bold text-white z-10">
                              {item.pontos} pts
                            </span>
                            <span className="absolute right-2 text-[10px] text-[#8a99a6] font-mono">
                              Qtd: {item.totalSeparado} | E: {item.erros}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico 2: Evolução Diária no Mês (Linha SVG - HIGH DENSITY) */}
              <div className="bg-[#1a2129] border border-[#2d3742] rounded p-4 flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    Evolução Diária de Separação
                  </h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ff6b35]" />Tarde (Folhas)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />Noite (Pedidos)</span>
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden mt-3">
                  {dadosEvolucaoDiaria.pontos.length === 0 ? (
                    <div className="text-center py-20 text-[#8a99a6]">
                      <p className="text-xs">Não existem lançamentos no mês filtrado.</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      
                      {/* Área da plotagem SVG */}
                      <div className="flex-1 w-full relative">
                        <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                          {/* Definições de gradientes */}
                          <defs>
                            <linearGradient id="glowTarde" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="glowNoite" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Linhas Horizontais de Grade de Fundo */}
                          <line x1="0" y1="20" x2="500" y2="20" stroke="#2d3742" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="70" x2="500" y2="70" stroke="#2d3742" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="120" x2="500" y2="120" stroke="#2d3742" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="170" x2="500" y2="170" stroke="#2d3742" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="210" x2="500" y2="210" stroke="#2d3742" strokeWidth="1" />

                          {/* Renderizar as curvas de linha do SVG */}
                          {(() => {
                            const ptsCount = dadosEvolucaoDiaria.pontos.length;
                            if (ptsCount < 2) return null;

                            // Mapear pontos para coordenadas SVG (x de 20 a 480, y de 20 a 200)
                            const coordenadasTarde = dadosEvolucaoDiaria.pontos.map((p, idx) => {
                              const x = 20 + ((460 / (ptsCount - 1)) * idx);
                              const y = 200 - ((p.Tarde / dadosEvolucaoDiaria.maxTarde) * 160);
                              return { x, y, valor: p.Tarde, dia: p.dia };
                            });

                            const coordenadasNoite = dadosEvolucaoDiaria.pontos.map((p, idx) => {
                              const x = 20 + ((460 / (ptsCount - 1)) * idx);
                              const y = 200 - ((p.Noite / dadosEvolucaoDiaria.maxNoite) * 160);
                              return { x, y, valor: p.Noite, dia: p.dia };
                            });

                            // Strings de caminhos SVG
                            const dPathTarde = coordenadasTarde.reduce((acc, p, i) => 
                              acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                            const dAreaTarde = dPathTarde + ` L ${coordenadasTarde[ptsCount-1].x} 210 L ${coordenadasTarde[0].x} 210 Z`;

                            const dPathNoite = coordenadasNoite.reduce((acc, p, i) => 
                              acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                            const dAreaNoite = dPathNoite + ` L ${coordenadasNoite[ptsCount-1].x} 210 L ${coordenadasNoite[0].x} 210 Z`;

                            return (
                              <>
                                {/* Preenchimento de Área Glow */}
                                <path d={dAreaTarde} fill="url(#glowTarde)" />
                                <path d={dAreaNoite} fill="url(#glowNoite)" />

                                {/* Caminhos das Linhas */}
                                <path d={dPathTarde} fill="none" stroke="#ff6b35" strokeWidth="2.5" strokeLinecap="round" />
                                <path d={dPathNoite} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />

                                {/* Círculos dos Pontos */}
                                {coordenadasTarde.map((pt, idx) => (
                                  <g key={`ct-${idx}`} className="group/dot">
                                    <circle cx={pt.x} cy={pt.y} r="3" fill="#ff6b35" stroke="#1a2129" strokeWidth="1.5" />
                                    <circle cx={pt.x} cy={pt.y} r="8" fill="#ff6b35" fillOpacity="0" className="hover:fill-opacity-20 cursor-pointer" />
                                    <title>{pt.dia}: {pt.valor} folhas (Tarde)</title>
                                  </g>
                                ))}

                                {coordenadasNoite.map((pt, idx) => (
                                  <g key={`cn-${idx}`} className="group/dot">
                                    <circle cx={pt.x} cy={pt.y} r="3" fill="#818cf8" stroke="#1a2129" strokeWidth="1.5" />
                                    <circle cx={pt.x} cy={pt.y} r="8" fill="#818cf8" fillOpacity="0" className="hover:fill-opacity-20 cursor-pointer" />
                                    <title>{pt.dia}: {pt.valor} pedidos (Noite)</title>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Eixo X com Labels */}
                      <div className="h-6 flex justify-between px-3 text-[9px] font-mono text-[#8a99a6] border-t border-[#2d3742] pt-1">
                        {dadosEvolucaoDiaria.pontos.map((p, idx, arr) => {
                          // Mostrar apenas algumas labels para não embolar
                          const mostrar = arr.length <= 15 || idx % Math.ceil(arr.length / 10) === 0 || idx === arr.length - 1;
                          return (
                            <span key={idx} className={mostrar ? 'visible' : 'invisible'}>
                              {p.dia.replace('Dia ', '')}
                            </span>
                          );
                        })}
                      </div>

                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* TABELA DE CLASSIFICAÇÃO COMPLETA (HIGH DENSITY) */}
            <div className="bg-[#1a2129] border border-[#2d3742] rounded overflow-hidden shadow-md">
              <div className="px-3 py-2.5 border-b border-[#2d3742] flex items-center justify-between bg-black/10">
                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Tabela de Classificação Geral</h3>
                  <p className="text-[10px] text-[#8899a6] font-medium uppercase font-mono mt-0.5">Automático / Critérios de Desempate</p>
                </div>
                <div className="text-[10px] bg-[#0f1419] px-2 py-0.5 rounded text-[#ff6b35] font-mono font-bold border border-[#ff6b35]/20">
                  Cadastros com Notas: {classificacaoOdernada.length}
                </div>
              </div>

              {/* Tabela Responsiva */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#111820] text-[#8899a6] border-b border-[#2d3742] select-none text-[9px] uppercase font-bold tracking-wider">
                      <th className="py-1.5 px-2.5 w-16">Rank</th>
                      <th className="py-1.5 px-2.5 cursor-pointer hover:bg-[#1a2129] hover:text-white" onClick={() => handleOrdenar('nome')}>
                        Colaborador {ordenacaoCampo === 'nome' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-1.5 px-2.5 cursor-pointer hover:bg-[#1a2129] hover:text-white" onClick={() => handleOrdenar('turno')}>
                        Turno {ordenacaoCampo === 'turno' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-1.5 px-2.5 text-center cursor-pointer hover:bg-[#1a2129] hover:text-white" onClick={() => handleOrdenar('diasTrabalhados')}>
                        Dias {ordenacaoCampo === 'diasTrabalhados' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-1.5 px-2.5 text-center cursor-pointer hover:bg-[#1a2129] hover:text-white" onClick={() => handleOrdenar('totalSeparado')}>
                        Separação {ordenacaoCampo === 'totalSeparado' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-1.5 px-2.5 text-center cursor-pointer hover:bg-[#1a2129] hover:text-white" onClick={() => handleOrdenar('erros')}>
                        Erros {ordenacaoCampo === 'erros' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-1.5 px-2.5 text-center cursor-pointer hover:bg-[#1a2129] hover:text-white bg-[#0f1419]/50 font-black" onClick={() => handleOrdenar('pontos')}>
                        Pts Finais {ordenacaoCampo === 'pontos' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-1.5 px-2.5 text-center cursor-pointer hover:bg-[#1a2129] hover:text-white" onClick={() => handleOrdenar('mediaDia')}>
                        Média {ordenacaoCampo === 'mediaDia' ? (ordenacaoDirecao === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3742]/45">
                    {classificacaoOdernada.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-[#8899a6]">
                          Nenhum dado encontrado para o período selecionado.
                        </td>
                      </tr>
                    ) : (
                      classificacaoOdernada.map((item, idx) => {
                        const podioBadge = idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : idx === 2 ? '🥉 3º' : `${idx + 1}º`;
                        return (
                          <tr key={`${item.separadorId}_${item.turno}`} className="hover:bg-white/[0.02] border-b border-[#2d3742]/30 transition-colors">
                            <td className="py-1 px-2.5 font-bold text-white whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                idx === 0 ? 'bg-amber-500/15 text-amber-400' : idx === 1 ? 'bg-slate-400/15 text-slate-300' : idx === 2 ? 'bg-orange-500/15 text-orange-400' : 'text-[#8899a6]'
                              }`}>
                                {podioBadge}
                              </span>
                            </td>
                            <td className="py-1 px-2.5 font-bold text-white truncate max-w-[130px] sm:max-w-none text-[11px]">
                              {item.nome}
                            </td>
                            <td className="py-1 px-2.5 whitespace-nowrap text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                item.turno === 'Tarde' ? 'bg-orange-500/15 text-orange-400' : 'bg-indigo-500/15 text-indigo-400'
                              }`}>
                                {item.turno === 'Tarde' ? 'TARDE' : 'NOITE'}
                              </span>
                            </td>
                            <td className="py-1 px-2.5 text-center font-mono font-semibold text-[#8899a6] text-[10px]">{item.diasTrabalhadosCount} d</td>
                            <td className="py-1 px-2.5 text-center font-bold font-mono text-[#e1e8ed] text-[11px]">{item.totalSeparado}</td>
                            <td className={`py-1 px-2.5 text-center font-bold font-mono text-[11px] ${item.erros > 0 ? 'text-[#ff3b30]' : 'text-[#8899a6]'}`}>
                              {item.erros}
                            </td>
                            <td className="py-1 px-2.5 text-center font-black font-mono text-[11px] bg-black/15">
                              <span className="text-[#ff6b35] font-black">{item.pontos}</span>
                            </td>
                            <td className="py-1 px-2.5 text-center font-mono text-[#8899a6] text-[10px]">{item.mediaDia}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==============================================
             ABA 3: GESTÃO DE SEPARADORES (CADASTRO)
           ============================================== */}
        {tabAtiva === 'separadores' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in text-xs">
            {/* Form de Cadastro (Esquerda) */}
            <div className="lg:col-span-4 bg-[#1a2129] border border-[#2d3742] rounded p-4 h-fit shadow-md">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2d3742]">
                <UserPlus className="w-4 h-4 text-[#ff6b35]" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  {sepEditId ? 'Editar Separador' : 'Adicionar Separador'}
                </h2>
              </div>

              <form onSubmit={handleSalvarSeparador} className="space-y-3">
                {/* Nome Completo */}
                <div>
                  <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Wellington Oliveira da Silva"
                    value={sepNome}
                    onChange={(e) => setSepNome(e.target.value)}
                    className="w-full bg-[#0f1419] border border-[#2d3742] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                    required
                  />
                </div>

                {/* Turno Padrão */}
                <div>
                  <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Turno Padrão de Separação</label>
                  <select
                    value={sepTurno}
                    onChange={(e) => setSepTurno(e.target.value as TurnoPadrao)}
                    className="w-full bg-[#0f1419] border border-[#2d3742] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6b35] cursor-pointer"
                  >
                    <option value="Tarde">Tarde (Folhas de Romaneio)</option>
                    <option value="Noite">Noite (Pedido a Pedido)</option>
                    <option value="Ambos">Ambos (Tarde e Noite)</option>
                  </select>
                </div>

                {/* Status (Apenas na edição) */}
                {sepEditId && (
                  <div>
                    <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Status Cadastral</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSepStatus('Ativo')}
                        className={`py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          sepStatus === 'Ativo' 
                            ? 'bg-[#00b87c] text-white' 
                            : 'bg-[#0f1419] text-[#8899a6] border border-[#2d3742]'
                        }`}
                      >
                        ATIVO
                      </button>
                      <button
                        type="button"
                        onClick={() => setSepStatus('Inativo')}
                        className={`py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          sepStatus === 'Inativo' 
                            ? 'bg-[#ff3b30] text-white' 
                            : 'bg-[#0f1419] text-[#8899a6] border border-[#2d3742]'
                        }`}
                      >
                        INATIVO
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-[#ff6b35] hover:bg-[#e0531f] text-white font-bold rounded py-1.5 text-xs shadow transition-colors cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar Dados
                  </button>
                  {sepEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSepEditId(null);
                        setSepNome('');
                        setSepTurno('Tarde');
                        setSepStatus('Ativo');
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-[#8899a6] hover:text-white rounded border border-[#2d3742] hover:bg-[#2d3742] transition-colors cursor-pointer uppercase"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Listagem de Cadastrados (Direita) */}
            <div className="lg:col-span-8 bg-[#1a2129] border border-[#2d3742] rounded p-4 shadow-md">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2d3742]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Separadores Cadastrados</h3>
                <span className="text-[10px] bg-[#0f1419] px-2 py-0.5 rounded border border-[#2d3742] font-mono text-[#ff6b35] font-bold">
                  TOTAL: {separadores.length}
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#111820] text-[#8899a6] border-b border-[#2d3742] font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-1.5 px-3">Nome Separador</th>
                      <th className="py-1.5 px-3 text-center">Turno Padrão</th>
                      <th className="py-1.5 px-3 text-center">Histórico</th>
                      <th className="py-1.5 px-3 text-center">Status</th>
                      <th className="py-1.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3742]/45">
                    {separadores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#8899a6]">
                          Nenhum separador cadastrado.
                        </td>
                      </tr>
                    ) : (
                      separadores.map(s => {
                        const temHist = separadorTemHistorico(s.id);
                        return (
                          <tr key={s.id} className="hover:bg-white/[0.02] border-b border-[#2d3742]/10 transition-colors">
                            <td className="py-1 px-3 font-bold text-white whitespace-nowrap text-[11px]">
                              {s.nome}
                            </td>
                            <td className="py-1 px-3 text-center whitespace-nowrap">
                              <span className="text-[9px] text-[#8899a6] font-bold bg-[#0f1419] px-1.5 py-0.5 border border-[#2d3742] rounded font-mono uppercase">
                                {s.turnoPadrao}
                              </span>
                            </td>
                            <td className="py-1 px-3 text-center whitespace-nowrap text-[9px] font-mono">
                              {temHist ? (
                                <span className="text-orange-400 font-bold bg-[#ff6b35]/15 px-1.5 py-0.5 border border-[#ff6b35]/20 rounded uppercase">
                                  Possui Lançamentos
                                </span>
                              ) : (
                                <span className="text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded uppercase">
                                  Sem Registros
                                </span>
                              )}
                            </td>
                            <td className="py-1 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => alternarStatusSeparadorDirect(s)}
                                className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-full transition-colors cursor-pointer ${
                                  s.status === 'Ativo' 
                                    ? 'bg-[#00b87c]/15 text-[#00b87c] border-[#00b87c]/30 hover:bg-[#00b87c]/25' 
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25 hover:bg-zinc-500/15'
                                }`}
                                title="Clique para alternar status rápido"
                              >
                                {s.status}
                              </button>
                            </td>
                            <td className="py-1 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => iniciarEdicaoSeparador(s)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#2d3742] transition-colors cursor-pointer"
                                  title="Editar Separador"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExcluirSeparador(s)}
                                  disabled={temHist}
                                  className={`p-1 rounded transition-colors ${
                                    temHist 
                                      ? 'text-zinc-700 cursor-not-allowed opacity-30' 
                                      : 'text-[#8899a6] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 cursor-pointer'
                                  }`}
                                  title={temHist ? "Inativo (Exclusão travada porque possui lançamentos)" : "Excluir cadastro"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
             ABA 4: HISTÓRICO COMPLETO (HIGH DENSITY)
           ============================================== */}
        {tabAtiva === 'historico' && (
          <div className="bg-[#1a2129] border border-[#2d3742] rounded shadow-md animate-fade-in space-y-3.5 p-4 text-xs">
            <div className="pb-2.5 border-b border-[#2d3742] flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#ff6b35]" />
                  Histórico de Todos os Lançamentos
                </h2>
                <p className="text-[10px] text-[#8899a6] font-medium uppercase font-mono mt-0.5">Exatidão, consulta completa e manutenção de cadastros</p>
              </div>

              {/* Botões Importação/Exportação */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportarTudoCSV}
                  className="flex items-center gap-1.5 bg-[#0f1419] border border-[#2d3742] hover:bg-[#2d3742] font-bold text-[10px] py-1 px-2 rounded transition-colors cursor-pointer text-[#ffe9d6] uppercase"
                >
                  <Download className="w-3 h-3 text-[#ff6b35]" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupJSON}
                  className="flex items-center gap-1.5 bg-[#0f1419] border border-[#2d3742] hover:bg-[#2d3742] font-bold text-[10px] py-1 px-2 rounded transition-colors cursor-pointer text-blue-300 uppercase"
                >
                  <Download className="w-3 h-3 text-blue-400" />
                  Backup JSON
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-[#0f1419] border border-[#2d3742] hover:bg-[#2d3742] font-bold text-[10px] py-1 px-2 rounded transition-colors cursor-pointer text-[#00b87c] uppercase"
                  >
                    <Upload className="w-3 h-3 text-[#00b87c]" />
                    Importar JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportarJSON}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Filtros Histórico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0f1419] p-3 rounded border border-[#2d3742]">
              {/* Filtro Período De */}
              <div>
                <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Data Inicial</label>
                <input
                  type="date"
                  value={histFiltroDe}
                  onChange={(e) => setHistFiltroDe(e.target.value)}
                  className="w-full bg-[#1a2129] border border-[#2d3742] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                />
              </div>

              {/* Filtro Período Até */}
              <div>
                <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Data Final</label>
                <input
                  type="date"
                  value={histFiltroAte}
                  onChange={(e) => setHistFiltroAte(e.target.value)}
                  className="w-full bg-[#1a2129] border border-[#2d3742] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#ff6b35]"
                />
              </div>

              {/* Filtro Separador */}
              <div>
                <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Separador</label>
                <select
                  value={histFiltroSeparador}
                  onChange={(e) => setHistFiltroSeparador(e.target.value)}
                  className="w-full bg-[#1a2129] border border-[#2d3742] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff6b35] cursor-pointer"
                >
                  <option value="Todos">Todos os Separadores</option>
                  {separadores.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} {s.status === 'Inativo' ? '(Inativo)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Turno */}
              <div>
                <label className="block text-[9px] font-bold text-[#8899a6] mb-1 uppercase tracking-wider">Turno</label>
                <select
                  value={histFiltroTurno}
                  onChange={(e) => setHistFiltroTurno(e.target.value)}
                  className="w-full bg-[#1a2129] border border-[#2d3742] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff6b35] cursor-pointer"
                >
                  <option value="Todos">Todos os Turnos</option>
                  <option value="Tarde">Tarde (Folhas Romaneio)</option>
                  <option value="Noite">Noite (Pedido a Pedido)</option>
                </select>
              </div>
            </div>

            {/* Tabela do Histórico */}
            <div className="overflow-x-auto w-full bg-[#1a2129] rounded border border-[#2d3742]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111820] text-[#8899a6] border-b border-[#2d3742] font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-1.5 px-3 w-28">Data</th>
                    <th className="py-1.5 px-3 w-24">Turno</th>
                    <th className="py-1.5 px-3">Separador</th>
                    <th className="py-1.5 px-3 text-center">Quantidade</th>
                    <th className="py-1.5 px-3 text-center">Erros</th>
                    <th className="py-1.5 px-3">Observações</th>
                    <th className="py-1.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d3742]/45">
                  {lancamentosFiltradosHistorico.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#8899a6]">
                        Nenhum lançamento corresponde aos filtros de busca aplicados.
                      </td>
                    </tr>
                  ) : (
                    lancamentosFiltradosHistorico.map(l => {
                      const sep = separadores.find(s => s.id === l.separadorId);
                      return (
                        <tr key={l.id} className="hover:bg-white/[0.02] border-b border-[#2d3742]/10 transition-colors">
                          <td className="py-1 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {l.data.split('-').reverse().join('/')}
                          </td>
                          <td className="py-1 px-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              l.turno === 'Tarde' 
                                ? 'bg-orange-500/15 text-orange-400' 
                                : 'bg-indigo-500/15 text-indigo-400'
                            }`}>
                              {l.turno === 'Tarde' ? '🌅 Tarde' : '🌃 Noite'}
                            </span>
                          </td>
                          <td className="py-1 px-3 font-bold text-white whitespace-nowrap text-[11px]">
                            {sep ? sep.nome : 'Desconhecido'}
                          </td>
                          <td className="py-1 px-3 text-center font-bold font-mono text-white">
                            {l.quantidade} <span className="text-[10px] text-[#8899a6] font-normal">{l.turno === 'Tarde' ? 'folhas' : 'pedidos'}</span>
                          </td>
                          <td className={`py-1 px-3 text-center font-bold font-mono ${l.erros > 0 ? 'text-[#ff3b30]' : 'text-[#8899a6]'}`}>
                            {l.erros}
                          </td>
                          <td className="py-1 px-3 text-xs italic text-orange-200/90 truncate max-w-[180px]" title={l.observacao}>
                            {l.observacao ? `"${l.observacao}"` : '---'}
                          </td>
                          <td className="py-1 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setLanEditando(l)}
                                className="p-1 bg-transparent hover:bg-[#2d3742] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Corrigir Lançamento"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExcluirLancamento(l.id)}
                                className="p-1 bg-transparent hover:bg-[#ff3b30]/10 text-[#8899a6] hover:text-[#ff3b30] rounded transition-colors cursor-pointer"
                                title="Deletar permanentemente"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-12 border-t border-[#2d3742] bg-[#1a2129] py-5 transition-all text-xs text-center text-[#8a99a6]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Marsil Distribuidora de Alimentos Atacadista • Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>BD: LocalStorage Ativo</span>
            <span>•</span>
            <button 
              onClick={() => {
                if (confirm('Deseja realmente limpar TODOS os dados e reiniciar o sistema?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }} 
              className="text-[#ff3b30] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <RefreshCw className="w-3 h-3" /> Reiniciar BD
            </button>
          </div>
        </div>
      </footer>


      {/* ==============================================
           MODAL DE CONFLITO / LANÇAMENTO DUPLICADO
         ============================================== */}
      {conflitoInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1a2129] border border-[#ff6b35]/30 rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-[#ff6b35] mb-4">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-md sm:text-lg font-bold text-white">Lançamento Duplicado!</h3>
                <p className="text-xs text-[#8a99a6]">Mesmo dia, turno e separador identificado</p>
              </div>
            </div>

            <div className="p-4 bg-[#0f1419] rounded-lg border border-[#2d3742] space-y-2 text-xs mb-5">
              <p className="text-white font-medium">Já existe registro criado para:</p>
              <p className="text-slate-300 font-bold">• {separadores.find(s => s.id === conflitoInfo.registroExistente.separadorId)?.nome}</p>
              <p className="text-[#8a99a6]">
                Data: <strong className="text-white">{conflitoInfo.registroExistente.data.split('-').reverse().join('/')}</strong> | 
                Turno: <strong className="text-white">{conflitoInfo.registroExistente.turno}</strong>
              </p>
              <p className="border-t border-[#2d3742]/75 my-2 pt-2 text-[#8a99a6] flex justify-between">
                <span>Registrado: <strong>{conflitoInfo.registroExistente.quantidade}</strong> | Erros: <strong>{conflitoInfo.registroExistente.erros}</strong></span>
                <span className="text-[#ff6b35]">Novo: <strong>{conflitoInfo.novoLancamento.quantidade}</strong> | Erros: <strong>{conflitoInfo.novoLancamento.erros}</strong></span>
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={resolverComSoma}
                className="w-full bg-[#ff6b35] hover:bg-[#e0531f] text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Somar as Quantidades (Soma os dois valores)
              </button>
              <button
                type="button"
                onClick={resolverComSubstituicao}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Substituir pelo Novo (Sobrescreve o antigo)
              </button>
              <button
                type="button"
                onClick={() => setConflitoInfo(null)}
                className="w-full bg-transparent hover:bg-zinc-800 text-[#8a99a6] hover:text-white font-semibold py-2 rounded-lg text-xs transition-colors border border-[#2d3742] cursor-pointer"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ==============================================
           MODAL EDITAR LANÇAMENTO (ABA HISTÓRICO)
         ============================================== */}
      {lanEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1a2129] border border-[#2d3742] rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2d3742]">
              <h3 className="font-bold text-white text-md">Corrigir Lançamento Selecionado</h3>
              <button 
                onClick={() => setLanEditando(null)} 
                className="text-[#8a99a6] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAtualizarLancamentoEditado} className="space-y-4">
              {/* Info não alterável */}
              <div className="bg-[#0f1419] p-3 rounded-lg border border-[#2d3742] text-xs space-y-1.5 mb-2 text-[#8a99a6]">
                <p>Separador: <strong className="text-white">{separadores.find(s => s.id === lanEditando.separadorId)?.nome}</strong></p>
                <p>Turno: <strong className="text-white">{lanEditando.turno}</strong></p>
                <p>Data Original: <strong className="text-white">{lanEditando.data.split('-').reverse().join('/')}</strong></p>
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-xs font-semibold text-[#8a99a6] mb-1.5">
                  Quantidade ({lanEditando.turno === 'Tarde' ? 'Folhas' : 'Pedidos'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={lanEditando.quantidade}
                  onChange={(e) => setLanEditando({ ...lanEditando, quantidade: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0f1419] border border-[#2d3742] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              {/* Erros */}
              <div>
                <label className="block text-xs font-semibold text-[#8a99a6] mb-1.5">Erros apontados</label>
                <input
                  type="number"
                  min="0"
                  value={lanEditando.erros}
                  onChange={(e) => setLanEditando({ ...lanEditando, erros: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#0f1419] border border-[#2d3742] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              {/* Obs */}
              <div>
                <label className="block text-xs font-semibold text-[#8a99a6] mb-1.5">Observação</label>
                <input
                  type="text"
                  value={lanEditando.observacao || ''}
                  onChange={(e) => setLanEditando({ ...lanEditando, observacao: e.target.value })}
                  className="w-full bg-[#0f1419] border border-[#2d3742] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#ff6b35] hover:bg-[#e0531f] text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Salvar Correções
                </button>
                <button
                  type="button"
                  onClick={() => setLanEditando(null)}
                  className="px-4 py-2 border border-[#2d3742] text-[#8a99a6] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ==============================================
           MODAL PREVIEW TEXTO WHATSAPP (ABA RANKING)
         ============================================== */}
      {isModalWhatappAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1a2129] border border-[#2d3742] rounded-xl max-w-md w-full p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#2d3742]">
              <h3 className="font-bold text-white text-sm sm:text-md flex items-center gap-1.5 text-green-400">
                <span>💬</span> Texto Editado p/ WhatsApp
              </h3>
              <button 
                onClick={() => setIsModalWhatsappAberto(false)} 
                className="text-[#8a99a6] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              readOnly
              rows={14}
              value={whatsappTexto}
              className="w-full bg-[#0f1419] p-3 text-xs sm:text-xs text-green-300 font-mono rounded-lg border border-[#2d3742] focus:outline-none resize-none"
            />

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleCopiarWhatsAppTexto}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar p/ Transperência
              </button>
              <button
                type="button"
                onClick={() => setIsModalWhatsappAberto(false)}
                className="px-4 py-2 border border-[#2d3742] text-[#8a99a6] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
