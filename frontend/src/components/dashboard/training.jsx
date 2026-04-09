import { useNavigate } from "react-router-dom";
import {modulos} from "../../data/modulosTraining";

const Training = () => {
    const navigate = useNavigate();
    return (
        <section className="mt-3">
            <h1 className="fw-bold text-center mb-4">Material de Capacitación</h1>
            <div className="row g-4">
                {modulos.map((modulo) => (
                    <div className="col-12 col-md-6 col-lg-4" key={modulo.id}>
                        <div className="card h-100 shadow-sm">
                        <div className="card-body d-flex flex-column">
                            <h5 className="card-title">{modulo.title}</h5>
                            <p className="card-text text-muted flex-grow-1">{modulo.descripcion}</p>
                            <button
                                className="btn btn-primary mt-3"
                                onClick={() => navigate(`/dashboard/training/modulo/${modulo.id}`)}
                                >
                                Ver módulo
                            </button>
                        </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Training;