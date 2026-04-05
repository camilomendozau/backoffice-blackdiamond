import { useContext, useState } from "react";
import { UserInfoContext } from "./navBar";
import axios from "axios";
import LoaderIcon from "../cards/utilities/spinner";
import SuccessModal from "./components/successModalMsg";

function EditProfile() {
    const { userInfo, setUserInfo, refetchUser } = useContext(UserInfoContext); // Asume que tienes setUserInfo
    const [loading, setLoading] = useState(false);

    // Update Profile Pic
    const [profilePicFile, setProfilePicFile] = useState([]);

    // Update Profile Pic input
    const onProfilePicChange = e => setProfilePicFile(e.target.files[0]);

    //Modal
    const [show, setShow] = useState(false);
    
    const handleClose = () => {
        setShow(false);
    }
    
    const handleShow = () => setShow(true);

    const [formData, setFormData] = useState({
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        email: userInfo.email,
        phone_number: userInfo.phone_number,
        date_of_birth: userInfo.date_of_birth,
        gender: userInfo.gender,
        home_address: userInfo.home_address,
        local_govt: userInfo.local_govt,
        state_of_origin: userInfo.state_of_origin,
        nationality: userInfo.nationality,
        image: userInfo.image,
        get_photo_url: userInfo.get_photo_url,
        bank_name: userInfo.bank_name,
        account_name: userInfo.account_name,
        account_number: userInfo.account_number,
    });

    const { first_name, last_name, phone_number, date_of_birth, home_address, local_govt, state_of_origin, nationality, get_photo_url, bank_name, account_name, account_number } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Select Input
    const [selectedOption, setSelectedOption] = useState('');

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    };

    //Form Error Message
    const [errorMessage, setErrorMessage] = useState([])

    //Modal Error
    const [errorshow, setErrorShow] = useState(false);
    const handleErrorClose = () => setErrorShow(false);
    const handleErrorShow = () => setErrorShow(true);

    const onSubmit = async (e) => {
        e.preventDefault();

        if (localStorage.getItem('access')) {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `JWT ${localStorage.getItem('access')}`,
                    'Accept': 'application/json'
                }
            };

            const formDataToSend = new FormData();
            formDataToSend.append('first_name', first_name);
            formDataToSend.append('last_name', last_name);
            formDataToSend.append('phone_number', phone_number);
            formDataToSend.append('date_of_birth', date_of_birth);
            formDataToSend.append('home_address', home_address);
            formDataToSend.append('local_govt', local_govt);
            formDataToSend.append('state_of_origin', state_of_origin);
            formDataToSend.append('nationality', nationality);
            formDataToSend.append('bank_name', bank_name);
            formDataToSend.append('account_name', account_name);
            formDataToSend.append('account_number', account_number);
            if (profilePicFile) {
                formDataToSend.append('image', profilePicFile);
            }
            formDataToSend.append('gender', selectedOption || formData.gender);

            try {
                setLoading(true);
                const res = await axios.put(
                    `${process.env.REACT_APP_API_URL}/auth/users/me/`, 
                    formDataToSend, 
                    config
                );
                
                if (res.status === 200) {
                    setUserInfo(res.data);
                    
                    setFormData({
                        ...formData,
                        ...res.data
                    });
                    
                    setLoading(false);
                    handleShow();
                }
            } catch (err) {
                setLoading(false);
                setErrorMessage(err.response?.data || {});
                handleErrorShow();
            }
        } else {
            console.error("User not authenticated");
        }
    };

    return (
        <div className="container mt-3 pb-5">
            <h2 className="text-center">Editar Perfil</h2>
            <div>
                <form className="row" onSubmit={e => onSubmit(e)}>
                    <div className="col-lg-9 mx-auto">
                        <section className="row g-3">
                            <section className="col-12 mt-5">
                                <h5 className="text-center">Imagen de Perfil</h5>
                            </section>
                            <section>
                                <img src={get_photo_url} className="d-flex justify-content-center align-items-center rounded-circle mx-auto" width="200" height="200" alt="..." />

                            </section>
                            <div className="col-12 input-group mb-3">
                                <input
                                    type="file"
                                    className="form-control"
                                    id="image"
                                    name="image"
                                    // value={formData.image}
                                    onChange={e => onProfilePicChange(e)}
                                />
                                <label className="input-group-text" for="inputGroupFile02">Subir</label>
                            </div>

                            <section className="col-12 mt-5">
                                <h5 className="text-center">Informacion Personal</h5>
                            </section>

                            <div className="col-md-6">
                                <label for="first_name" className="form-label">Nombres</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="first_name"
                                    name="first_name"
                                    value={first_name}
                                    onChange={e => onChange(e)}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label for="last_name" className="form-label">Apellidos</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="last_name"
                                    name="last_name"
                                    value={last_name}
                                    onChange={e => onChange(e)}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label for="email" class="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control inputfield"
                                    id="email"
                                    aria-describedby="emailHelp"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label for="phone_number" className="form-label">Numero de Celular</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="phone_number"
                                    aria-describedby="emailHelp"
                                    name="phone_number"
                                    value={phone_number}
                                    onChange={e => onChange(e)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label for="gender-select" className="form-label">Genero</label>
                                <select id="gender-select" className="form-select inputfield" aria-label="Default select example" value={selectedOption === '' ? formData.gender : selectedOption} onChange={handleOptionChange}>
                                    <option selected>-- Selecciona --</option>
                                    <option value="Male">Masculino</option>
                                    <option value="Female">Femenino</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label for="date_of_birth" className="form-label">Fecha de Nacimiento<small className="text-primary fw-bold"> (DD/MM/YYYY)</small></label>
                                <input
                                    type="date"
                                    // pattern="\d{4}-\d{2}-\d{2}"
                                    className="form-control inputfield"
                                    id="date_of_birth"
                                    name="date_of_birth"
                                    value={date_of_birth}
                                    onChange={e => onChange(e)}
                                    required />
                            </div>

                            <section className="col-12 mt-5">
                                <h5 className="text-center">Informacion Bancaria</h5>
                            </section>

                            <div className="col-md-6">
                                <label for="bank_name" class="form-label">Nombre del Banco</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="bank_name"
                                    name="bank_name"
                                    value={bank_name}
                                    onChange={e => onChange(e)}
                                    />
                            </div>
                            <div className="col-md-6">
                                <label for="account_name" class="form-label">Nombre de propietario</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="account_name"
                                    name="account_name"
                                    value={account_name}
                                    onChange={e => onChange(e)}
                                    />
                            </div>
                            <div className="col-md-6">
                                <label for="account_number" className="form-label">Numero de Cuenta</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="account_number"
                                    name="account_number"
                                    value={account_number}
                                    onChange={e => onChange(e)}
                                     />
                            </div>

                            <section className="col-12 mt-5">
                                <h5 className="text-center">Direccion de Contacto</h5>
                            </section>
                            <div className="col-12">
                                <label for="home_address" className="form-label">Direccion de Vivienda</label>
                                <textarea
                                    className="form-control"
                                    id="home_address"
                                    rows="4"
                                    onChange={e => onChange(e)}
                                    name="home_address"
                                    value={home_address}
                                    
                                ></textarea>
                            </div>
                            <div className="col-md-6">
                                <label for="local_govt" className="form-label">Municipio</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="local_govt"
                                    name="local_govt"
                                    value={local_govt}
                                    onChange={e => onChange(e)}
                                     />
                            </div>
                            <div className="col-md-6">
                                <label for="state_of_origin" className="form-label">Pais de Origen</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="state_of_origin"
                                    name="state_of_origin"
                                    value={state_of_origin}
                                    onChange={e => onChange(e)}
                                     />
                            </div>

                            <div className="col-md-6">
                                <label for="nationality" className="form-label">Nacionalidad</label>
                                <input
                                    type="text"
                                    className="form-control inputfield"
                                    id="nationality"
                                    name="nationality"
                                    value={nationality}
                                    onChange={e => onChange(e)}
                                     />
                            </div>
                        </section>

                        <section className="d-grid mt-4">
                            <button
                                type="submit"
                                className={loading ? 'btn btn-primary disabled' : 'btn btn-primary'}
                            >
                                {loading
                                    ?
                                    <LoaderIcon />
                                    :
                                    null
                                }
                                Actualizar Perfil
                            </button>
                        </section>
                    </div>
                </form>
            </div>

            {
                show
                    ?
                    <SuccessModal
                        title='Perfil Actualizado'
                        message='Los datos de tu perfil han sido actualizados exitosamente'
                        show={show}
                        onClose={handleClose}
                    />
                    :
                    null
            }

            {
                errorshow
                    ?
                    <SuccessModal
                        title='Soluciona el error abajo!!!'
                        message='El siguiente error a sucedido!!!'
                        show={errorshow}
                        onClose={handleErrorClose}
                        errorMessage={errorMessage}
                    />
                    :
                    null
            }
        </div>
    );
}

export default EditProfile;