const feeModel = require('../models/fee.model');
const usersModel = require('../models/user.model');
const { buildNameKeys } = require('../utils/normalize');

const KPI_API_URL = process.env.KPI_API_URL;
const KPI_SECRET_TOKEN = process.env.KPI_SECRET_TOKEN;

function buildKpiMap(recapPerUser) {
    const map = new Map();
    for (const entry of recapPerUser) {
        for (const key of buildNameKeys(entry.name)) {
            if (!map.has(key)) map.set(key, entry);
        }
    }
    return map;
}

// Returns current month in 'YYYY-MM' format
function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const getKpiTeams = async (_req, res) => {
    try {
        const params = new URLSearchParams({ is_active: 'true', per_page: '100' });
        const response = await fetch(`${KPI_API_URL}/api/teams?${params.toString()}`, {
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                message: 'KPI Teams API Error',
                status: 'failed',
                status_code: String(response.status),
                kpi_error: err,
            });
        }

        const json = await response.json();
        res.json({
            message: 'Get KPI Teams Success',
            status: 'success',
            status_code: '200',
            data: json.data || [],
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            status: 'failed',
            status_code: '500',
            serverMessage: error.message,
        });
    }
};

const getSalaryWithKpi = async (req, res) => {
    const { month, team_id } = req.query;
    const resolvedMonth = month || currentMonth();

    try {
        const idPotongan = 2;
        const getPotonganMangkir = await usersModel.getPotonganMangkir(idPotongan);
        const PotonganMangkir = getPotonganMangkir.value;

        const kpiParams = new URLSearchParams({ month: resolvedMonth });
        if (team_id) kpiParams.append('team_id', team_id);

        const [salaryResult, kpiResponse] = await Promise.all([
            feeModel.getSalaryKaryawanByMonth(PotonganMangkir, resolvedMonth),
            fetch(
                `${KPI_API_URL}/api/v1/internal/reports/monthly-tasks/recap-per-user?${kpiParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${KPI_SECRET_TOKEN}`,
                        Accept: 'application/json',
                    },
                }
            ),
        ]);

        if (!kpiResponse.ok) {
            const kpiError = await kpiResponse.json().catch(() => ({}));
            return res.status(kpiResponse.status).json({
                message: 'KPI API Error',
                status: 'failed',
                status_code: String(kpiResponse.status),
                kpi_error: kpiError,
            });
        }

        const [salaryData] = salaryResult;
        const kpiJson = await kpiResponse.json();
        const recapPerUser = kpiJson?.data?.recap_per_user || [];
        const kpiMap = buildKpiMap(recapPerUser);

        // When team_id is selected, only include employees that have a KPI match (members of that team)
        const filterByTeam = Boolean(team_id);

        const result = salaryData
            .map((employee) => {
                const matchKey = buildNameKeys(employee.name).find((k) => kpiMap.has(k)) || null;
                const kpi = matchKey ? kpiMap.get(matchKey) : null;

                // If filtering by team and no KPI match → exclude this employee
                if (filterByTeam && !kpi) return null;

                const compliancePersen = kpi ? parseFloat(kpi.compliance_persen) : null;

                // kena_potongan is based solely on compliance_persen < 80 (our rule)
                // kpi_status from KPI app is based on target_score — different metric, display only
                const kenaPotongan = kpi ? compliancePersen < 80 : false;
                // Use Math.abs so deduction is always positive — avoids reversing the sign when salary is already negative
                const potonganKpi = kenaPotongan ? Math.round(Math.abs(employee.total_gaji_akhir) * 0.1) : 0;
                const totalGajiFinal = employee.total_gaji_akhir - potonganKpi;

                return {
                    ...employee,
                    compliance_persen: compliancePersen,
                    performance_label: kpi?.performance_label || null,
                    kpi_status_target: kpi?.kpi_status || null,   // KPI app's own target status
                    kena_potongan: kenaPotongan,                   // our 80% rule result
                    potongan_kpi: potonganKpi,
                    total_gaji_final: totalGajiFinal,
                };
            })
            .filter(Boolean);

        res.json({
            message: 'Get Salary with KPI Success',
            status: 'success',
            status_code: '200',
            kpi_period: kpiJson?.data?.month || resolvedMonth,
            kpi_team: kpiJson?.data?.team || null,
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            status: 'failed',
            status_code: '500',
            serverMessage: error.message,
        });
    }
};

module.exports = { getSalaryWithKpi, getKpiTeams };
