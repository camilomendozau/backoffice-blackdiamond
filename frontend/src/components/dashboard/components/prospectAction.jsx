import { useState } from 'react';
import useProspectWebSocket from '../../../hooks/useProspectWebSocket';
import SPANISH from '../../../locales/es';

function ProspectActions({ userCode }) {
    const { prospects, isConnected, error } = useProspectWebSocket(userCode);
    const [selectedProspectId, setSelectedProspectId] = useState(null);

    const selectedProspect = prospects.find(p => p.id === selectedProspectId);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    function getMeasureSymbol(key) {
        let symbol = '';
        if (key === 'time_on_page') {
            symbol = 'segundos';
        }
        if (key === 'percentage_played') {
            symbol = '%';
        }
        return symbol;
    } 


    const getEventIcon = (eventName) => {
        const icons = {
            'page_view': '👁️',
            'video_start': '▶️',
            'video_end': '⏹️',
            'button_click': '👆',
            'form_submit': '📝',
            'download': '📥',
            'scroll_depth': '📜',
            'cta_click': '🎯',
            'video_pause': '⏸️',
            'page_exit': '🚪',
        };
        return icons[eventName] || '📌';
    };

    return (
        <div className="container mt-4">
            {/* Status Bar */}
            <div className={`alert ${isConnected ? 'alert-success' : 'alert-warning'} d-flex justify-content-between align-items-center`}>
                <span>
                    {isConnected ? '✅ Conectado en tiempo real' : '⚠️ Reconectando...'}
                </span>
                <small>Total prospectos: {prospects.length}</small>
            </div>

            {error && (
                <div className="alert alert-danger">
                    ❌ Error: {error}
                </div>
            )}

            <div className="row">
                {/* Lista de Prospectos */}
                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header bg-primary">
                            <h5 className="mb-0 text-white">Prospectos Activos</h5>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {prospects.length === 0 ? (
                                <div className="text-center p-4 text-muted">
                                    No hay prospectos aún
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {prospects.map((prospect) => (
                                        <button
                                            key={prospect.id}
                                            className={`list-group-item list-group-item-action ${selectedProspectId === prospect.id ? 'active' : ''}`}
                                            onClick={() => setSelectedProspectId(prospect.id)}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>
                                                        {prospect.first_name || prospect.last_name ? (prospect.first_name + ' ' + prospect.last_name) : 'Anónimo'}
                                                    </strong>
                                                    <br />
                                                    <strong className="text">
                                                        {prospect.prospect_id || 'No tiene id'}
                                                    </strong>
                                                    <br />
                                                    <small className="text">
                                                        {prospect.country || 'País desconocido'}
                                                    </small>
                                                </div>
                                                <span className="badge bg-primary rounded-pill">
                                                    {prospect.total_actions || 0}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detalles del Prospecto Seleccionado */}
                <div className="col-lg-8">
                    {selectedProspect ? (
                        <div className="card">
                            <div className="card-header bg-info text-white">
                                <h5 className="mb-0">
                                    Acciones de {selectedProspect.first_name || selectedProspect.last_name? (selectedProspect.first_name+' '+selectedProspect.last_name) : 'Prospecto'}
                                </h5>
                            </div>
                            <div className="card-body">
                                {/* Información del Prospecto */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <p><strong>Email:</strong> {selectedProspect.email || 'N/A'}</p>
                                        <p><strong>Teléfono:</strong> {selectedProspect.phone || 'N/A'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>País:</strong> {selectedProspect.country || 'N/A'}</p>
                                        <p><strong>Primera visita:</strong> {formatDate(selectedProspect.created_at)}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Navegador:</strong> {selectedProspect.agent || 'N/A'}</p>
                                    </div>
                                </div>

                                <hr />

                                {/* Timeline de Acciones */}
                                <h6 className="mb-3">Actividades en Pagina</h6>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {(!selectedProspect.actions || selectedProspect.actions.length === 0) ? (
                                        <div className="text-center text-muted p-4">
                                            No hay acciones registradas
                                        </div>
                                    ) : (
                                        <div className="timeline">
                                            {selectedProspect.actions.map((action, index) => (
                                                <div key={action.id || index} className="card mb-2 border-start border-primary border-3">
                                                    <div className="card-body py-2">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="mb-1">
                                                                    {getEventIcon(action.event_name)} {SPANISH[action.event_name]}
                                                                </h6>
                                                                {action.path && (
                                                                    <small className="text-muted">
                                                                        📍 {action.path}
                                                                    </small>
                                                                )}
                                                                {action.details && Object.keys(action.details).length > 0 && (
                                                                    <div className="mt-1 d-flex flex-row">
                                                                        Descripción -&gt;
                                                                        <div className="badge bg-light text-dark d-flex flex-column align-items-start p-1">
                                                                            {Object.entries(action.details).map(([key, value]) => (
                                                                                <div key={key} className="mb-1">
                                                                                    <strong className='text-dark'>
                                                                                        {SPANISH[key]}:
                                                                                    </strong>
                                                                                    <small className="ms-1 text-muted">
                                                                                        {value} {getMeasureSymbol(key)}
                                                                                    </small>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <small className="text-muted">
                                                                {formatDate(action.timestamp)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-body text-center p-5">
                                <h4 className="text-muted">Selecciona un prospecto</h4>
                                <p>Haz clic en un prospecto de la lista para ver sus acciones</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProspectActions;
