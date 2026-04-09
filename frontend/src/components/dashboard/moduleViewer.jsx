import { Suspense} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { modulos } from "../../data/modulosTraining";
import VideoPlayer from "./components/videoPlayer";



export default function ModuleTrainingViewer(){
    // const [hiddenBtn, setHiddenBtn] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();
    const modulo = modulos.find((m) => m.id === parseInt(id));

    if (!modulo) return <div className="text-center my-5">Módulo no encontrado</div>;
    const handleVideoEnd = async () => {
        if (modulo.siguiente) {
            navigate(`/dashboard/training/modulo/${modulo.siguiente}`);
        } else {
            navigate("/dashboard/training"); // último módulo → vuelve al índice
        }
    };
    return(
        <div className="container my-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/dashboard/training")}
                >
                    ← Volver al índice
                </button>
                {modulo.siguiente && (
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/dashboard/training/modulo/${modulo.siguiente}`)}
                    >
                        Siguiente módulo
                        <i className="fa-solid fa-circle-arrow-right p-1"></i>
                    </button>
                )}
            </div>
            
            <div>
                <h3 className="text-center mb-2">{modulo.title}</h3>
                <Suspense fallback={<div className="text-center my-5">Cargando video...</div>}>
                    <VideoPlayer src={modulo.src} onEndVideo={handleVideoEnd}/>
                </Suspense>
                <p class="fs-6 fs-md-4 fw-medium text-center m-4">
                    {modulo.descripcion}
                </p>
            </div>
        </div>
    )

}