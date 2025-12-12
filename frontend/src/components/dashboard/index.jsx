import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserInfoContext } from "./navBar";
import { DownlineListContext, ReferralListContext, WithdrawalListContext, UserAccountInfoContext } from "./navBar";
import CopyToClipboardButton from "./components/clipCopy";
import UpdateProfileAlert from "./components/updateProfileAlert";


function DashboardHome() {
    const downlineList = useContext(DownlineListContext)
    const referralList = useContext(ReferralListContext)
    const withdrawalList = useContext(WithdrawalListContext)
    const userAccountInfo = useContext(UserAccountInfoContext)


    // Downline List
    const reversedList = downlineList.reverse();
    const lastFourDownlines = reversedList.slice(0, 4);
    const totalDownline = Object.keys(downlineList).length

    //Referral List
    const reversedReferralList = referralList.reverse();
    const lastFourReferrals = reversedReferralList.slice(0, 4);

    //Withdrawal List
    const reversedWithdrawalList = withdrawalList.reverse();
    const lastFourWithdrawals = reversedWithdrawalList.slice(0, 4)

    //User Info
    const userInfo = useContext(UserInfoContext)

    return (
        <section className="container mt-4">
            <UpdateProfileAlert />
            <div class="row row-cols-1 row-cols-lg-4 g-4">
                <div class="col">
                    <div class="card">
                        <div class="card-body text-center" >
                            <p class="card-text">Balance Total</p>
                            <h5 class="card-title">{`N${userAccountInfo.total_balance}`}</h5>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card text-center">
                        <div class="card-body">
                            <p class="card-text">Total de lineas</p>
                            <h5 class="card-title">{totalDownline}</h5>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <div class="card-body text-center">
                            <p class="card-text">Bonos por Unir</p>
                            <h5 class="card-title">{`N${userAccountInfo.match_bonus_earned}`}</h5>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card text-center">
                        <div class="card-body">
                            <p class="card-text">Bonos por Referido</p>
                            <h5 class="card-title">{`N${userAccountInfo.referral_bonus_earned}`}</h5>
                        </div>
                    </div>
                </div>
            </div>


            <div class="row g-5 mt-4">
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-body">
                            <section class="text-center">
                                <img src={userInfo.get_photo_url} class="rounded-circle mx-auto" width="150" height="150"
                                    alt="..." />
                            </section>

                            <header className="text-center mb-1">
                                <h4 className="card-title">Nivel {userAccountInfo.depth}</h4>
                                <span className={userInfo.status === 'Active' ? 'badge rounded-pill bg-primary me-1' : 'badge rounded-pill bg-danger me-1'}>
                                    {userInfo.status}
                                </span>

                                <span className={userInfo.plan === 'Premium' ? 'badge rounded-pill bg-secondary' : 'badge rounded-pill bg-info'}>
                                    {userInfo.plan} Plan
                                </span>
                            </header>
                            <section class="table-responsive">
                                <table class="table ">
                                    <thead class="table-primary">
                                        <tr>
                                            <th scope="col" colspan="2" class="text-center">Datos Personales</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>ID de Promotor:</td>
                                            <td>
                                                {userInfo.code}
                                                <span className="ms-3">
                                                    <CopyToClipboardButton text={userInfo.code} />
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Nombres:</td>
                                            <td>{userInfo.first_name}</td>
                                        </tr>
                                        <tr>
                                            <td>Apellidos:</td>
                                            <td>{userInfo.last_name}</td>
                                        </tr>
                                        <tr>
                                            <td>Email:</td>
                                            <td>{userInfo.email}</td>
                                        </tr>
                                        <tr>
                                            <td>Fecha de Nacimiento:</td>
                                            <td>{userInfo.date_of_birth}</td>
                                        </tr>
                                        <tr>
                                            <td>Genero:</td>
                                            <td>{userInfo.gender}</td>
                                        </tr>
                                        <tr>
                                            <td>Numero de Telefono:</td>
                                            <td>{userInfo.phone_number}</td>
                                        </tr>
                                        <tr>
                                            <td>Recomendado por:</td>
                                            <td>{userInfo.recommended_by_email}</td>
                                        </tr>
                                        <tr>
                                            <td>Fecha de union:</td>
                                            <td>{userInfo.date_joined}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table class="table ">
                                    <thead class="table-primary">
                                        <tr>
                                            <th scope="col" colspan="2" class="text-center">Datos Bancarios</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Nombre de Banco:</td>
                                            <td>{userInfo.bank_name}</td>
                                        </tr>
                                        <tr>
                                            <td>Nombre de propietario:</td>
                                            <td>{userInfo.account_name}</td>
                                        </tr>

                                        <tr>
                                            <td>Numero de Cuenta:</td>
                                            <td>{userInfo.account_number}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table class="table ">
                                    <thead class="table-primary">
                                        <tr>
                                            <th scope="col" colspan="2" class="text-center">Direccion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Pais de origen:</td>
                                            <td>{userInfo.state_of_origin}</td>
                                        </tr>
                                        <tr>
                                            <td>Ciudad de origen:</td>
                                            <td>{userInfo.local_govt}</td>
                                        </tr>
                                        <tr>
                                            <td>Direccion de Residencia:</td>
                                            <td>{userInfo.home_address}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="row">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title text-center mb-2">Ultimos Referidos</h5>
                                <section class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-primary">
                                            <tr>
                                                <th scope="col">Nombres</th>
                                                <th scope="col">Apellidos</th>
                                                <th scope="col">Email</th>
                                            </tr>
                                        </thead>

                                        {Object.keys(referralList).length === 0
                                            ?
                                            <tbody>
                                                <tr>
                                                    <td colspan="3" class="text-center">No hay referidos todavia</td>
                                                </tr>
                                            </tbody>
                                            :
                                            <tbody>
                                                {lastFourReferrals.map((item) =>
                                                    <tr>
                                                        <td>{item.first_name}</td>
                                                        <td>{item.last_name}</td>
                                                        <td>{item.email}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        }
                                    </table>
                                    <Link to="/dashboard/referrals" className="d-grid btn btn-primary">Ver Todos</Link>
                                </section>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title text-center mb-2">Ultimas Lineas</h5>
                                <section class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-primary">
                                            <tr>
                                                <th scope="col">Nombres</th>
                                                <th scope="col">Apellidos</th>
                                                <th scope="col">Email</th>
                                            </tr>
                                        </thead>
                                        {Object.keys(downlineList).length === 0
                                            ?
                                            <tbody>
                                                <tr>
                                                    <td colspan="3" class="text-center">No hay Lineas todavia</td>
                                                </tr>

                                            </tbody>
                                            :
                                            <tbody>
                                                {lastFourDownlines.map((item) => (
                                                    <tr>
                                                        <td>{item.first_name}</td>
                                                        <td>{item.last_name}</td>
                                                        <td>{item.email}</td>
                                                    </tr>

                                                ))}
                                            </tbody>
                                        }
                                    </table>
                                    <Link to="/dashboard/downlines" className="d-grid btn btn-primary">Ver todo</Link>
                                </section>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title text-center mb-2">Solicitudes de Retiro</h5>
                                <section class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-primary">
                                            <tr>
                                                <th scope="col">Fecha</th>
                                                <th scope="col">Monto</th>
                                                <th scope="col">Estado</th>
                                                <th scope="col">Monto Actual</th>
                                            </tr>
                                        </thead>

                                        {Object.keys(withdrawalList).length === 0
                                            ?
                                            <tbody>
                                                <tr>
                                                    <td colspan="4" class="text-center">Todavia no has solictado ningun retiro</td>
                                                </tr>
                                            </tbody>
                                            :
                                            <tbody>
                                                {lastFourWithdrawals.map((item) =>
                                                    <tr>
                                                        <td>{item.created_at}</td>
                                                        <td>{item.amount}</td>
                                                        <td>{item.status}</td>
                                                        <td>{item.balance_before}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        }

                                    </table>
                                    <Link to="/dashboard/withdrawals" className="d-grid btn btn-primary">Ver Todos</Link>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default DashboardHome;