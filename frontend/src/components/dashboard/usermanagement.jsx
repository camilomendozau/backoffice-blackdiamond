// components/dashboard/admin/PendingUsers.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function UserManagement() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingUserCode, setProcessingUserCode] = useState(null);

    // Fetch pending users
    const fetchPendingUsers = async () => {
        setLoading(true);
        
        if (localStorage.getItem('access')) {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `JWT ${localStorage.getItem('access')}`,
                    'Accept': 'application/json'
                }
            };

            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/dashboard/admin/pending-users/`,
                    config
                );
                setPendingUsers(res.data.users);
            } catch (err) {
                console.error('Error fetching pending users:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los usuarios pendientes'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    // Approve user
    const handleApprove = async (code, userName) => {
        const result = await Swal.fire({
            title: '¿Aprobar usuario?',
            html: `¿Estás seguro de aprobar a <strong>${userName}</strong>?<br><br>El usuario recibirá un email de confirmación.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, aprobar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setProcessingUserCode(code);

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `JWT ${localStorage.getItem('access')}`,
                    'Accept': 'application/json'
                }
            };

            try {
                const res = await axios.post(
                    `${process.env.REACT_APP_API_URL}/dashboard/admin/approve-user/${code}/`,
                    {},
                    config
                );

                Swal.fire({
                    icon: 'success',
                    title: '¡Usuario aprobado!',
                    html: `<strong>${userName}</strong> ha sido aprobado exitosamente.<br><br>Código de referencia: <code>${res.data.user.code}</code>`,
                    confirmButtonColor: '#28a745'
                }).then(() => {
                    fetchPendingUsers();
                }).finally(() => {
                    window.location.reload();
                });
                
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.detail || 'No se pudo aprobar el usuario'
                });
            } finally {
                setProcessingUserCode(null);
            }
        }
    };

    // Reject user
    const handleReject = async (code, userName) => {
        const result = await Swal.fire({
            title: '¿Rechazar usuario?',
            html: `¿Estás seguro de rechazar a <strong>${userName}</strong>?<br><br><strong style="color: red;">Esta acción eliminará permanentemente la cuenta.</strong>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, rechazar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setProcessingUserCode(code);

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `JWT ${localStorage.getItem('access')}`,
                    'Accept': 'application/json'
                }
            };

            try {
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/dashboard/admin/reject-user/${code}/`,
                    {},
                    config
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Usuario rechazado',
                    text: `${userName} ha sido rechazado y eliminado del sistema.`,
                    confirmButtonColor: '#28a745'
                }).then(() => {
                    fetchPendingUsers();
                }).finally(() => {
                    window.location.reload();
                });
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.detail || 'No se pudo rechazar el usuario'
                });
            } finally {
                setProcessingUserCode(null);
            }
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="row">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">
                                <i className="fa-solid fa-user-check me-2"></i>
                                Usuarios Pendientes de Aprobación
                            </h4>
                            <span className="badge bg-light text-primary fs-6">
                                {pendingUsers.length} {pendingUsers.length === 1 ? 'usuario' : 'usuarios'}
                            </span>
                        </div>

                        <div className="card-body">
                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fa-solid fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                    <h5 className="mt-3 text-muted">No hay usuarios pendientes</h5>
                                    <p className="text-muted">Todos los usuarios han sido procesados</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Usuario</th>
                                                <th>Email</th>
                                                <th>Teléfono</th>
                                                <th>Plan</th>
                                                <th>Referido por</th>
                                                <th>Fecha</th>
                                                <th className="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td>
                                                        <strong>{user.first_name} {user.last_name}</strong>
                                                    </td>
                                                    <td>
                                                        <a href={`mailto:${user.email}`} className="text-decoration-none">
                                                            {user.email}
                                                        </a>
                                                    </td>
                                                    <td>
                                                        {user.phone_number || (
                                                            <span className="text-muted">No proporcionado</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${user.plan === 'Premium' ? 'bg-warning text-dark' : 'bg-info'}`}>
                                                            {user.plan}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {user.referrer_info || 'Sin referidor'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {new Date(user.date_joined).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </small>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleApprove(user.code, `${user.first_name} ${user.last_name}`)}
                                                                disabled={processingUserCode === user.id}
                                                            >
                                                                {processingUserCode === user.id ? (
                                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                                ) : (
                                                                    <>
                                                                        <i className="fa-solid fa-check me-1"></i>
                                                                        Aprobar
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleReject(user.code, `${user.first_name} ${user.last_name}`)}
                                                                disabled={processingUserCode === user.id}
                                                            >
                                                                <i className="fa-solid fa-times me-1"></i>
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}