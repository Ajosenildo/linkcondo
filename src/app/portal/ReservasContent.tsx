// ARQUIVO FINAL (V9 - Preservado): src/app/portal/ReservasContent.tsx
// ATUALIZADO: Adicionado apenas o botão de Sair (Logout), mantendo todo o código original.

import { useState, useEffect, useMemo } from 'react'
import jwt from 'jsonwebtoken'
import Calendar from 'react-calendar'
import { useRouter } from 'next/navigation' // <-- 1. IMPORT NOVO

// --- Interfaces ---
interface UnidadeInfo {
  idCondominio: string;
  nomeCondominio: string;
  idUnidade: string;
  unidade: string; 
}
interface DecodedToken {
  unidades: UnidadeInfo[];
  subdomain: string;
  acao: string;
}
interface AreaComum {
  id_area_are: string;
  st_nome_are: string;
  st_regras_are: string;
  vl_valor_rec: string;
  nm_disponibilizardias_are?: string; 
  fl_bloquearinad_are?: string;     
}
interface Reserva {
  id_reserva_res: string;
  dt_reserva_res: string;
  fl_status_res: string;
  nm_fila_res: string;
}
interface MinhaReserva extends Reserva {
  st_nome_are: string;
  id_area_are: string; 
  regraCancelamentoDias: number;
  id_unidade_uni: string; // Garantindo que o ID interno esteja aqui para o mapeamento
}
interface ReservasContentProps {
  token: string;
}
interface UniqueCondo {
  idCondominio: string;
  nomeCondominio: string;
}

const RESERVAS_POR_PAGINA = 5;

// --- O COMPONENTE ---
export default function ReservasContent({ token }: ReservasContentProps) {
  const router = useRouter(); // <-- 2. HOOK DE NAVEGAÇÃO

  // --- Estados ---
  const [unidadesList, setUnidadesList] = useState<UnidadeInfo[]>([]); 
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null); 
  const [loadingToken, setLoadingToken] = useState(true);

  const [minhasReservas, setMinhasReservas] = useState<MinhaReserva[]>([]);
  const [loadingMinhasReservas, setLoadingMinhasReservas] = useState(false);
  const [errorMinhasReservas, setErrorMinhasReservas] = useState('');
  const [visibleReservasCount, setVisibleReservasCount] = useState(RESERVAS_POR_PAGINA);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [errorAreas, setErrorAreas] = useState('');
  
  const [selectedArea, setSelectedArea] = useState<AreaComum | null>(null);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [errorReservas, setErrorReservas] = useState('');
  const [reservasOcupadas, setReservasOcupadas] = useState<Date[]>([]); 
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  
  const [maxDaysRule, setMaxDaysRule] = useState<number | null>(null);

  const [reservationMessage, setReservationMessage] = useState('');
  const [isReservationLoading, setIsReservationLoading] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false); 
  const [unitsForSelection, setUnitsForSelection] = useState<UnidadeInfo[]>([]); 
  const [dataParaReservar, setDataParaReservar] = useState<Date | null>(null); 


  // --- Efeitos ---
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwt.decode(token) as DecodedToken;
        if (!decoded || !decoded.unidades || decoded.unidades.length === 0) {
          throw new Error('Token inválido ou sem unidades.');
        }
        
        setUnidadesList(decoded.unidades);

        if (decoded.unidades.length === 1) {
          setSelectedCondoId(decoded.unidades[0].idCondominio);
        }
        
      } catch (e: any) {
        console.error("Erro ao decodificar token:", e);
        setErrorAreas('Erro ao validar seu acesso. Tente novamente.');
      } finally {
        setLoadingToken(false);
      }
    }
  }, [token]);

  // --- Lógica de De-duplicação ---
  const uniqueCondos = useMemo(() => {
    const map = new Map<string, UniqueCondo>();
    unidadesList.forEach(unidade => {
      if (!map.has(unidade.idCondominio)) {
        map.set(unidade.idCondominio, {
          idCondominio: unidade.idCondominio,
          nomeCondominio: unidade.nomeCondominio,
        });
      }
    });
    return Array.from(map.values());
  }, [unidadesList]);

  // Helper para pegar o nome do condomínio selecionado
  const selectedCondoName = useMemo(() => {
    return uniqueCondos.find(c => c.idCondominio === selectedCondoId)?.nomeCondominio || 'seu condomínio';
  }, [selectedCondoId, uniqueCondos]);

  // --- NOVO: Mapa de Unidades (ID Interno -> Nome Visual) ---
  const unitNameMap = useMemo(() => {
      const map = new Map<string, string>(); // Map<idUnidade, unidade_name>
      unidadesList.forEach(u => map.set(u.idUnidade, u.unidade));
      return map;
  }, [unidadesList]);
  // --- FIM NOVO ---


  useEffect(() => {
    if (token && selectedCondoId) {
      
      const fetchAreas = async (idCondominio: string) => {
        setLoadingAreas(true); setErrorAreas(''); setAreas([]);
        try {
          const response = await fetch('/api/reservas/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, idCondominio }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Não foi possível buscar as áreas.');
          if (Array.isArray(data)) setAreas(data);
          else if (data && data.areas_semelhantes) setAreas(data.areas_semelhantes);
          else setAreas([]);
        } catch (err: any) { setErrorAreas(err.message);
        } finally { setLoadingAreas(false); }
      };

      const fetchMinhasReservas = async (idCondominio: string) => {
        setLoadingMinhasReservas(true); setErrorMinhasReservas(''); setMinhasReservas([]);
        try {
          const response = await fetch('/api/reservas/minhas-reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, idCondominio }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Não foi possível buscar suas reservas.');
          if (Array.isArray(data)) {
            setMinhasReservas(data);
          } else {
            setMinhasReservas([]);
          }
        } catch (err: any) { setErrorMinhasReservas(err.message);
        } finally { setLoadingMinhasReservas(false); }
      };

      fetchAreas(selectedCondoId);
      fetchMinhasReservas(selectedCondoId);
    }
  }, [token, selectedCondoId]);


  // --- 3. FUNÇÃO DE LOGOUT ---
  const handleLogout = () => {
      // Redireciona para a home com um parâmetro ?logout=true
      router.push('/?logout=true'); 
  }

  // --- Handlers ---
  const handleAreaClick = async (area: AreaComum) => {
    if (!selectedCondoId) return; 

    setSelectedArea(area); 
    setLoadingReservas(true); setErrorReservas(''); setReservasOcupadas([]); 
    setDataParaReservar(null); setReservationMessage(''); 
    
    const maxDays = parseInt(area.nm_disponibilizardias_are || '0', 10);
    setMaxDaysRule(maxDays > 0 ? maxDays : null);
    
    setIsCalendarModalOpen(true); 

    try {
      const response = await fetch('/api/reservas/areasreservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            token, 
            idArea: area.id_area_are,
            idCondominio: selectedCondoId
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível buscar o calendário.');
      
      let reservas: Reserva[] = [];
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
         Object.values(data).forEach((group: any) => {
            if (group && Array.isArray(group.areas_semelhantes)) {
                group.areas_semelhantes.forEach((area: any) => {
                    if (area.reservas && Array.isArray(area.reservas)) {
                        reservas.push(...area.reservas);
                    }
                });
            }
        });
      } else if (Array.isArray(data)) {
          data.forEach((area: any) => {
             if (area.reservas && Array.isArray(area.reservas)) {
                reservas.push(...area.reservas);
            }
          });
      }

      const datasOcupadas = reservas.map(reserva => {
        const [dataParte] = reserva.dt_reserva_res.split(' '); 
        const [mes, dia, ano] = dataParte.split('/').map(Number);
        return new Date(Date.UTC(ano, mes - 1, dia)); 
      });
      setReservasOcupadas(datasOcupadas);
    } catch (err: any) { setErrorReservas(err.message);
    } finally { setLoadingReservas(false); }
  }
  
  const handleDateClick = (date: Date) => {
    if (!selectedCondoId || !selectedArea) return;

    setDataParaReservar(date); 
    
    const matchingUnits = unidadesList.filter(u => u.idCondominio === selectedCondoId);

    if (matchingUnits.length === 1) {
      const dataFormatada = date.toLocaleDateString('pt-BR');
      if (window.confirm(`Tem certeza que deseja solicitar a reserva para ${selectedArea.st_nome_are} (Unidade: ${matchingUnits[0].unidade}) no dia ${dataFormatada}?`)) {
        solicitarReserva(date, matchingUnits[0].idUnidade); 
      }
    } else {
      setUnitsForSelection(matchingUnits); 
      setIsUnitModalOpen(true); 
    }
  }

  const solicitarReserva = async (date: Date, idUnidade: string) => {
    if (!selectedArea || !selectedCondoId) return;

    setIsReservationLoading(true);
    setReservationMessage('');

    try {
      const response = await fetch('/api/reservas/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          idArea: selectedArea.id_area_are,
          dataReserva: date.toISOString(), 
          idCondominio: selectedCondoId, 
          idUnidade: idUnidade,         
          regraBloquearInadimplente: selectedArea.fl_bloquearinad_are || '0',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível solicitar a reserva.');
      }
      
      setReservationMessage('Sucesso! Sua solicitação de reserva foi enviada.');
      setReservasOcupadas([...reservasOcupadas, date]);
      setDataParaReservar(null); 
      setIsUnitModalOpen(false); 
      
      const novaReserva: MinhaReserva = { 
        ...data.data, 
        st_nome_are: selectedArea.st_nome_are, 
        dt_reserva_res: date.toLocaleDateString('pt-BR', {timeZone: 'UTC'}) + ' 00:00:00',
        fl_status_res: '0',
        id_area_are: selectedArea.id_area_are,
        regraCancelamentoDias: 0 
      };
      
      setMinhasReservas([novaReserva, ...minhasReservas]);
      
    } catch (err: any) {
      setReservationMessage(err.message);
      setIsUnitModalOpen(false);
    } finally {
      setIsReservationLoading(false);
    }
  }

  const handleUnitSelection = (unidade: UnidadeInfo) => {
    if (dataParaReservar) {
      solicitarReserva(dataParaReservar, unidade.idUnidade);
    }
  }

  const handleCancel = async (reserva: MinhaReserva) => {
    const motivo = prompt("Para cancelar, por favor, digite o motivo:");
    
    if (!motivo || motivo.trim().length === 0) {
      alert("O motivo é obrigatório para o cancelamento.");
      return; 
    }

    setCancelingId(reserva.id_reserva_res);
    setErrorMinhasReservas('');
    try {
      const response = await fetch('/api/reservas/cancelar', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          idCondominio: selectedCondoId,
          idReserva: reserva.id_reserva_res,
          idArea: reserva.id_area_are,
          motivo: motivo
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível cancelar a reserva.');
      }

      alert("Reserva cancelada com sucesso!");
      setMinhasReservas(prevReservas => 
        prevReservas.filter(r => r.id_reserva_res !== reserva.id_reserva_res)
      );

    } catch (err: any) {
      alert(`Erro ao cancelar: ${err.message}`);
      setErrorMinhasReservas(`Erro ao cancelar: ${err.message}`);
    } finally {
      setCancelingId(null);
    }
  }

  const canCancel = (reserva: MinhaReserva): { pode: boolean; dias: number } => {
      const [datePart] = reserva.dt_reserva_res.split(' ');
      const [mes, dia, ano] = datePart.split('/').map(Number);
      const eventDate = new Date(Date.UTC(ano, mes - 1, dia));
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
          pode: diffDays > reserva.regraCancelamentoDias,
          dias: reserva.regraCancelamentoDias
      };
  }

  const handleCloseCalendarModal = () => {
    setIsCalendarModalOpen(false);
    setSelectedArea(null);
    setErrorReservas('');
    setReservationMessage('');
    setMaxDaysRule(null);
  }

  const tileDisabled = ({ date, view }: { date: Date, view: string }): boolean => {
    if (view !== 'month') return false; 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (maxDaysRule && maxDaysRule > 0) {
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + maxDaysRule); 
        if (date > maxDate) {
            return true;
        }
    }
    return reservasOcupadas.some(
      d => d.getDate() === date.getDate() &&
           d.getMonth() === date.getMonth() &&
           d.getFullYear() === date.getFullYear()
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case '0': return <span className="text-yellow-600 font-semibold">Pendente</span>;
      case '1': return <span className="text-green-600 font-semibold">Confirmada</span>;
      case '-1': return <span className="text-red-600">Cancelada</span>;
      default: return <span className="text-gray-500">Desconhecido</span>;
    }
  }

  // --- RENDERIZAÇÃO ---
  
  // 1. Carregando Token
  if (loadingToken) {
    return (
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-gray-700">Validando seu acesso...</p>
      </div>
    );
  }

  // 2. Erro no Token
  if (errorAreas && !selectedCondoId) {
     return (
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-red-500 font-semibold">{errorAreas}</p>
      </div>
    );
  }

  // 3. SELETOR DE CONDOMÍNIO
  if (!selectedCondoId) {
    return (
      // --- 4. ADICIONADO relative PARA POSICIONAR O BOTÃO ---
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md relative">
        
        {/* --- 5. BOTÃO DE SAIR NO TOPO --- */}
        <div className="absolute top-4 right-4">
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Sair</button>
        </div>
        {/* --- FIM BOTÃO --- */}

        <h1 className="text-2xl font-bold text-center text-gray-800">
          Selecione o Condomínio
        </h1>
        <p className="text-center text-gray-600">
          Notamos que seu e-mail está cadastrado em mais de um condomínio.
          Para qual deles você deseja fazer uma reserva?
        </p>
        <div className="space-y-3 pt-4">
          {uniqueCondos.map((condo) => (
            <button
              key={condo.idCondominio} 
              onClick={() => setSelectedCondoId(condo.idCondominio)} 
              className="w-full px-4 py-3 text-left font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {condo.nomeCondominio}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 4. QUADRO DE RESERVAS (Principal)
  return (
    <>
      {/* Estilos */}
      <style jsx global>{`
        .react-calendar {
          border-radius: 8px; border: none; width: 100%;
          max-width: 400px; margin: 0 auto; font-family: inherit;
        }
        .react-calendar__navigation button {
          color: #374151; font-weight: 700; font-size: 1.1rem;
        }
        .react-calendar__navigation button:hover {
          background-color: #f3f4f6;
        }
        .react-calendar__navigation button:disabled {
          color: #d1d5db;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none; font-weight: 600; color: #6b7280;
        }
        .react-calendar__tile {
          border-radius: 6px; height: 48px; color: #1f2937;
        }
        .react-calendar__tile:disabled {
          background-color: #f3f4f6; color: #9ca3af; text-decoration: line-through;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #dbeafe;
        }
        .react-calendar__tile--now {
          background: #fef3c7; color: #92400e;
        }
        .react-calendar__tile--active {
          background: #2563eb !important; color: white !important;
        }
      `}</style>
      
      {/* --- PÁGINA PRINCIPAL --- */}
      {/* --- 6. ADICIONADO relative PARA POSICIONAR O BOTÃO --- */}
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md relative">
        
        {/* --- 7. BOTÃO DE SAIR NO TOPO --- */}
        <div className="absolute top-4 right-4">
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Sair</button>
        </div>
        {/* --- FIM BOTÃO --- */}

        <h1 className="text-2xl font-bold text-center text-gray-800">
          Quadro de Reservas
        </h1>
        <p className="text-center text-gray-600">
          Bem-vindo ao sistema de reservas de {selectedCondoName}.
        </p>
        
        {uniqueCondos.length > 1 && (
            <button
              onClick={() => {
                setSelectedCondoId(null); setAreas([]); setMinhasReservas([]);
                setErrorAreas(''); setErrorMinhasReservas('');
                setVisibleReservasCount(RESERVAS_POR_PAGINA);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              &larr; Trocar de condomínio
            </button>
        )}
        <hr />
        
        {/* --- SEÇÃO: "SUAS RESERVAS" (COM PAGINAÇÃO E BOTÃO CANCELAR) --- */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-700">Suas Reservas Solicitadas</h2>
          {loadingMinhasReservas && <p className="text-center text-gray-500">Buscando suas reservas...</p>}
          {errorMinhasReservas && <p className="text-center text-red-500 font-semibold">{errorMinhasReservas}</p>}
          
          {!loadingMinhasReservas && !errorMinhasReservas && minhasReservas.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              Você não possui nenhuma reserva pendente ou confirmada para este condomínio.
            </p>
          )}

          {!loadingMinhasReservas && !errorMinhasReservas && minhasReservas.length > 0 && (
            <div className="space-y-2">
              {minhasReservas.slice(0, visibleReservasCount).map((reserva, index) => {

                const isCanceling = cancelingId === reserva.id_reserva_res;
                const { pode: podeCancelar, dias: regraDias } = canCancel(reserva);
                const isPendenteOuConfirmada = reserva.fl_status_res === '0' || reserva.fl_status_res === '1';
                
                // --- NOVO: BUSCA O NOME DA UNIDADE ---
                const unitName = unitNameMap.get(reserva.id_unidade_uni);
                // --- FIM NOVO ---
                
                return (
                  <div 
                    key={`${reserva.id_reserva_res}-${index}`}
                    className="p-3 border rounded-md bg-gray-50 flex justify-between items-start"
                  >
                    {/* Informações da Reserva */}
                    <div className="flex-grow">
                      <h4 className="font-semibold text-gray-800">
                        {reserva.st_nome_are}
                        {/* --- EXIBIÇÃO DA UNIDADE --- */}
                        {unitName && (
                            <span className="ml-2 text-xs font-normal text-blue-800 bg-blue-100 px-2 py-1 rounded-full">
                                Unidade {unitName}
                            </span>
                        )}
                        {/* --- FIM EXIBIÇÃO --- */}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Data: {new Date(reserva.dt_reserva_res.split(' ')[0].replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2T12:00:00Z')).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    {/* Status e Botão Cancelar */}
                    <div className="flex flex-col items-end flex-shrink-0 ml-2">
                      {getStatusText(reserva.fl_status_res)}

                      {isPendenteOuConfirmada && (
                        <button
                          onClick={() => handleCancel(reserva)}
                          disabled={!podeCancelar || isCanceling}
                          className={`mt-2 text-xs font-semibold ${
                            !podeCancelar 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          title={!podeCancelar ? `Cancelamento deve ser feito com mais de ${regraDias} dia(s) de antecedência.` : 'Cancelar reserva'}
                        >
                          {isCanceling ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>

                  </div>
                )
              })}
              
              {minhasReservas.length > visibleReservasCount && (
                <button
                  onClick={() => setVisibleReservasCount(prevCount => prevCount + RESERVAS_POR_PAGINA)}
                  className="w-full mt-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Ver mais antigas
                </button>
              )}
            </div>
          )}
        </div>
        <hr />

        {/* --- Seção 1: Listagem de Áreas --- */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-700">1. Selecione a Área para Nova Reserva</h2>
          {loadingAreas && <p className="text-center text-gray-500">Buscando áreas...</p>}
          {errorAreas && <p className="text-center text-red-500">{errorAreas}</p>}
          
          {!loadingAreas && !errorAreas && areas.length === 0 && (
            <p className="text-center text-gray-500">Nenhuma área de reserva encontrada para este condomínio.</p>
          )}
          
          {!loadingAreas && !errorAreas && areas.length > 0 && (
            <div className="space-y-4">
              {areas.map((area) => (
                <div key={area.id_area_are} className="p-4 border rounded-md flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{area.st_nome_are}</h3>
                    {area.vl_valor_rec && parseFloat(area.vl_valor_rec) > 0 ? (
                      <p className="text-sm text-gray-600">R$ {parseFloat(area.vl_valor_rec).toFixed(2).replace('.', ',')}</p>
                    ) : (
                      <p className="text-sm text-gray-600">Sem custo</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAreaClick(area)}
                    disabled={loadingReservas && selectedArea?.id_area_are === area.id_area_are}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loadingReservas && selectedArea?.id_area_are === area.id_area_are ? '...' : 'Ver Calendário'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* --- SEÇÃO 2: O MODAL DO CALENDÁRIO --- */}
      {isCalendarModalOpen && selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Data para: <span className="text-blue-600">{selectedArea.st_nome_are}</span>
              </h2>
              <button onClick={handleCloseCalendarModal} className="text-2xl font-bold text-gray-500 hover:text-gray-800">
                &times;
              </button>
            </div>

            <div className="p-4">
              {loadingReservas && (
                <div className="h-64 flex justify-center items-center">
                  <p className="text-center text-gray-500">Carregando calendário...</p>
                </div>
              )}
              {errorReservas && (
                <div className="h-64 flex justify-center items-center">
                  <p className="text-center text-red-500">{errorReservas}</p>
                </div>
              )}
              
              {!loadingReservas && !errorReservas && (
                <div className="flex flex-col items-center">
                  <Calendar
                    // @ts-ignore
                    onChange={handleDateClick} 
                    value={dataParaReservar}
                    tileDisabled={tileDisabled} 
                    className="react-calendar-custom" 
                    locale="pt-BR"
                  />
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-md w-full">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Legenda:</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center">
                        <span className="w-4 h-4 rounded-md bg-white border border-gray-400 mr-2"></span>
                        <span className="text-xs text-gray-600">Disponível</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 rounded-md bg-yellow-200 border border-yellow-300 mr-2"></span>
                        <span className="text-xs text-gray-600">Hoje</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 rounded-md bg-gray-100 border border-gray-300 mr-2"></span>
                        <span className="text-xs text-gray-600">Ocupado / Passado</span>
                      </div>
                    </div>
                  </div>

                  {isReservationLoading && (
                    <p className="mt-4 text-sm text-center text-blue-600">Solicitando reserva...</p>
                  )}
                  
                  {reservationMessage && (
                     <p className={`mt-4 text-sm text-center font-semibold ${
                       reservationMessage.includes('Sucesso') 
                         ? 'text-green-600' 
                         : 'text-blue-600 italic' 
                     }`}>
                       {reservationMessage}
                     </p>
                  )}

                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseCalendarModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100"
                >
                  Fechar
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SEÇÃO 3: NOVO MODAL (SELETOR DE UNIDADE) --- */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Selecione a Unidade</h2>
            </div>

            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Você está reservando para <strong>{selectedArea?.st_nome_are}</strong> no dia <strong>{dataParaReservar?.toLocaleDateString('pt-BR')}</strong>.
              </p>
              <p className="text-gray-600 mb-4">
                Para qual das suas unidades neste condomínio você deseja fazer esta reserva?
              </p>
              
              <div className="space-y-2">
                {unitsForSelection.map((unidade) => (
                  <button
                    key={unidade.idUnidade}
                    onClick={() => handleUnitSelection(unidade)}
                    disabled={isReservationLoading}
                    className="w-full px-4 py-3 text-left font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    Unidade: {unidade.unidade || unidade.idUnidade}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  disabled={isReservationLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100 disabled:bg-gray-50"
                >
                  Cancelar
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}