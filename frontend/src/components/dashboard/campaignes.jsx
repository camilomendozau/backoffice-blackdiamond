import NotificationCard from "./components/notificationCard";

const Campaignes = () => {
    return (
        <section className="mt-3">
            <h1 className="text-center mb-2">Campañas</h1>
            <button className="d-grid btn btn-primary">Crear nueva campaña</button>
            <NotificationCard popover={false} />
        </section>
    );
}

export default Campaignes;