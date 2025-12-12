import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';
import { createaccount } from "../../../actions/auth";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useContext } from "react";
import { CompanyInformationContext } from "../../../App";
import { myStyle } from "./login";
import { connect } from 'react-redux';
import LoaderIcon from "../../cards/utilities/spinner";


const CreateAccount = ({ createaccount, isAuthenticated, error, status }) => {
    const companyInfo = useContext(CompanyInformationContext)
    const [loading, setLoading] = useState(false);

    // Check Referrer
    const [referralCode, setReferralCode] = useState("");
    const [isValidReferral, setIsValidReferral] = useState(false);
    const [referrerInfo, setReferrerInfo] = useState({
        id: '',
        first_name: '',
        last_name: '',
        code: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)

        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/dashboard/check-refcode/${referralCode}`
        );
        setLoading(false)
        const data = await response.json();
        setReferrerInfo(data)

        if (data.code) {
            setIsValidReferral(true);
        } else {
            alert("Invalid referral code. Please try again.");
        }
    };

    //Modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        password: '',
        re_password: ''
    });

    const { first_name, last_name, phone_number, email, password, re_password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Plan Select Input
    const [selectedPlanOption, setSelectedPlanOption] = useState({ plan: '' });
    const { plan } = selectedPlanOption

    const handlePlanOptionChange = (event) => {
        setSelectedPlanOption({ [event.target.name]: event.target.value });
    };

    const onSubmit = e => {
        e.preventDefault();
        setLoading(true)

        async function signupHandler() {
            try {
                await createaccount(first_name, last_name, phone_number, email, referralCode, plan, password, re_password);
                // handle successful signup
            } catch (error) {
                // handle signup error
            } finally {
                setLoading(false);
            }
        }

        signupHandler()

    };




    useEffect(() => {
        // createaccount(first_name, last_name, phone_number, email, password, re_password);
        if (status === 201) {
            handleShow()
        }
    }, [status]);


    return (
        <section style={myStyle}>
            <section class="container reg-forms min-vh-100">
                <section class="row justify-content-center">
                    <section class="col-lg-5 mx-auto min-vh-100">
                        <div class="px-4 py-6 mx-auto bg-light min-vh-100">
                            <Link to="/" className="text-decoration-none">
                                <header className="text-center mb-5">
                                    <img src={companyInfo.get_logo_url} alt="" width="50" height="50" className="mx-auto" />
                                    <h5 className="mt-1">{companyInfo.company_name}</h5>
                                </header>
                            </Link>

                            {
                                isValidReferral
                                    ?
                                    null
                                    :
                                    <form onSubmit={handleSubmit}>
                                        <div class="alert alert-primary alert-dismissible fade show" role="alert">
                                            <strong>Bienvenido!</strong> Necesitas un codigo de referido <strong>para completar la Creacion de la Cuenta.</strong> Contacta al <strong>Administrador</strong> para obtener un Codigo de Referido, si no lo tienes.
                                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                        </div>
                                        <label for="referrer_code" className="form-label">Codigo de Referido:</label>
                                        <input
                                            className="form-control inputfield"
                                            type="text"
                                            id="referrer_code"
                                            value={referralCode}
                                            onChange={(e) => setReferralCode(e.target.value)}
                                            placeholder="Ingresa tu codigo de 12 digitos"
                                            required
                                        />
                                        <section className="d-grid mt-2">
                                            <button type="submit" className={loading ? "btn btn-primary disabled" : "btn btn-primary"}>
                                                {loading
                                                    ?
                                                    <LoaderIcon />
                                                    :
                                                    "Verificar Codigo de Referido"
                                                }
                                            </button>
                                        </section>
                                    </form>
                            }


                            {isValidReferral
                                ?
                                <>
                                    <h4 className="text-center">Crear Cuenta</h4>
                                    <div class="alert alert-primary alert-dismissible fade show mt-1 text-center" role="alert">
                                        <p>Nombre de Referido: <span className="fw-bold">{referrerInfo.first_name} {referrerInfo.last_name}</span></p>
                                        <p>Numero de Referido: <span className="fw-bold">{referrerInfo.code}</span></p>
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>

                                    <form className="mt-2" onSubmit={onSubmit}>
                                        <input type="hidden" value={referrerInfo.code} />
                                        <div class="col-md-12 mb-3">
                                            <label for="first_name" className="form-label">Nombres</label>
                                            <input
                                                type="text"
                                                className="form-control inputfield"
                                                id="first_name"
                                                name="first_name"
                                                value={first_name}
                                                onChange={e => onChange(e)}
                                                required
                                            />
                                            {error ?
                                                <small className="text-danger">
                                                    {error.first_name}
                                                </small>
                                                :
                                                null}
                                        </div>

                                        <div class="col-md-12 mb-3">
                                            <label for="last_name" class="form-label">Apellidos</label>
                                            <input
                                                type="text"
                                                class="form-control inputfield"
                                                id="last_name"
                                                name="last_name"
                                                value={last_name}
                                                onChange={e => onChange(e)}
                                                required
                                            />
                                            {error ?
                                                <small className="text-danger">
                                                    {error.last_name}
                                                </small>
                                                :
                                                null}
                                        </div>

                                        <div class="col-md-12 mb-3">
                                            <label for="email" class="form-label">Correo Electronico</label>
                                            <input
                                                type="email"
                                                class="form-control inputfield"
                                                id="email"
                                                aria-describedby="emailHelp"
                                                name="email"
                                                value={email}
                                                onChange={e => onChange(e)}
                                                required
                                            />
                                            {error ?
                                                <small className="text-danger">
                                                    {error.email}
                                                </small>
                                                :
                                                null}
                                        </div>

                                        <div class="col-md-12 mb-3">
                                            <label for="phone_number" class="form-label">Numero de Telefono</label>
                                            <input
                                                type="text"
                                                class="form-control inputfield"
                                                id="phone_number"
                                                aria-describedby="emailHelp"
                                                name="phone_number"
                                                value={phone_number}
                                                onChange={e => onChange(e)}
                                                required
                                            />
                                            {error ?
                                                <small className="text-danger">
                                                    {error.phone_number}
                                                </small>
                                                :
                                                null}
                                        </div>

                                        <div className="col-md-12 mb-3">
                                            <label for="plan" className="form-label">Plan</label>
                                            <select
                                                id="plan"
                                                className="form-select inputfield"
                                                aria-label="Default select example"
                                                name="plan"
                                                value={plan}
                                                onChange={handlePlanOptionChange}
                                            >
                                                <option selected>-- Select --</option>
                                                <option value="Eureka">Eureka - N15,500</option>
                                                <option value="Premium">Premium - N15,000</option>
                                            </select>
                                        </div>

                                        <div class="col-md-12 mb-3">
                                            <label for="password1" class="form-label">Contraseña</label>
                                            <input
                                                type="password"
                                                class="form-control inputfield"
                                                id="password1"
                                                name="password"
                                                // minLength='6'
                                                value={password}
                                                onChange={e => onChange(e)}
                                                required
                                            />
                                            {error ?
                                                <small className="text-danger">
                                                    {error.password}
                                                    {error.non_field_errors}
                                                </small>
                                                :
                                                null}
                                        </div>

                                        <div class="col-md-12 mb-2">
                                            <label for="password2" class="form-label">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                class="form-control inputfield"
                                                id="password2"
                                                name="re_password"
                                                // minLength='6'
                                                value={re_password}
                                                onChange={e => onChange(e)}
                                                required
                                            />
                                            {error ?
                                                <small className="text-danger">
                                                    {error.password}
                                                    {error.non_field_errors}
                                                </small>
                                                :
                                                null}
                                        </div>

                                        <div class="col-12 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="gridCheck" required />
                                                <label class="form-check-label " for="gridCheck">
                                                    <small>Al unirte, tu aceptas nuestros <Link to="/terms-and-conditions" className="text-decoration-none text-primary fw-bold">Terminos de Servicio</Link> y <Link to="/privacy-policy" className="text-decoration-none text-primary fw-bold">Politicas de Privacidad</Link></small>
                                                </label>
                                            </div>
                                        </div>

                                        <section className="d-grid">
                                            <button type="submit" className={loading ? "btn btn-primary disabled" : "btn btn-primary"}>
                                                {loading
                                                    ?
                                                    <LoaderIcon />
                                                    :
                                                    "Crear Cuenta"
                                                }
                                            </button>
                                        </section>
                                    </form>
                                </>
                                :
                                null
                            }
                            <div class="mt-3">
                                <p class="text-center">Ya tienes una cuenta? <Link to="/login" class="fw-bold text-decoration-none">iniciar sesion</Link></p>
                            </div>

                        </div>
                    </section>
                </section>
                <Modal
                    show={show}
                    onHide={handleClose}
                    backdrop="static"
                    keyboard={false}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Perfil Creado</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        Tu has creado exitosamente tu cuenta. Revisa tu correo electronico para verificar tu cuenta. Si no recibes el correo, revisa tu carpeta de spam o correo no deseado.
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="btn btn-outline-primary" onClick={handleClose}>
                            Cerrar
                        </Button>
                        <Link className="btn btn-primary" to="/login">Iniciar Sesion</Link>
                    </Modal.Footer>
                </Modal>
            </section>
        </section>
    );
}
const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated,
    error: state.auth.error,
    status: state.auth.status
});
export default connect(mapStateToProps, { createaccount })(CreateAccount);
