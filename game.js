const canvasBanCo = document.getElementById('ban-co');
const nguCanhBanCo = canvasBanCo.getContext('2d');
const canvasKhoiTiepTheo = document.getElementById('khoi-tiep-theo');
const nguCanhKhoiTiepTheo = canvasKhoiTiepTheo.getContext('2d');

nguCanhBanCo.scale(24, 24);
nguCanhKhoiTiepTheo.scale(20, 20);

const BANG_MAU = [
    null,
    '#0ea5e9',
    '#3b82f6',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#a855f7',
    '#ef4444',
    '#6b7280'
];

const CAC_KHOI_GACH = {
    'I': [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    'J': [[0, 2, 0], [0, 2, 0], [2, 2, 0]],
    'L': [[0, 3, 0], [0, 3, 0], [0, 3, 3]],
    'O': [[4, 4], [4, 4]],
    'S': [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
    'T': [[0, 0, 0], [6, 6, 6], [0, 6, 0]],
    'Z': [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
};

const DANH_SACH_KHOI = 'IJLOSTZ';

let bangXepGach = taoMaTran(10, 20);
let nguoiChoi = {
    toaDo: { x: 0, y: 0 },
    maTranKhoi: null,
    maTranTiepTheo: null,
    diemSo: 0,
    soHangDaXoa: 0,
    capDo: 1,
    soKhoiDaDat: 0
};

let boDemThoiGianRoi = 0;
let thoiGianRoi = 1000;
let thoiDiemTruoc = 0;
let maYeuCauHoatHoa;
let dangTamDung = false;
let troChoiKetThuc = false;
let thoiDiemRungChanCuoi = 0;

function taoMaTran(soCot, soHang) {
    const maTran = [];
    while (soHang--) {
        maTran.push(new Array(soCot).fill(0));
    }
    return maTran;
}

function taoKhoiGach(loaiKhoi) {
    return CAC_KHOI_GACH[loaiKhoi];
}

function veMaTran(maTran, toaDo, nguCanh = nguCanhBanCo, laBongMo = false) {
    maTran.forEach((hang, y) => {
        hang.forEach((giaTri, x) => {
            if (giaTri !== 0) {
                nguCanh.fillStyle = BANG_MAU[giaTri];
                if (laBongMo) {
                    nguCanh.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    nguCanh.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    nguCanh.lineWidth = 0.05;
                    nguCanh.strokeRect(x + toaDo.x, y + toaDo.y, 1, 1);
                }
                nguCanh.fillRect(x + toaDo.x, y + toaDo.y, 1, 1);
            }
        });
    });
}

function kiemTraVaCham(bangXepGach, nguoiChoi) {
    const maTran = nguoiChoi.maTranKhoi;
    const toaDo = nguoiChoi.toaDo;
    for (let y = 0; y < maTran.length; ++y) {
        for (let x = 0; x < maTran[y].length; ++x) {
            if (maTran[y][x] !== 0 &&
               (bangXepGach[y + toaDo.y] && bangXepGach[y + toaDo.y][x + toaDo.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function hopNhatKhoiGach(bangXepGach, nguoiChoi) {
    nguoiChoi.maTranKhoi.forEach((hang, y) => {
        hang.forEach((giaTri, x) => {
            if (giaTri !== 0) {
                bangXepGach[y + nguoiChoi.toaDo.y][x + nguoiChoi.toaDo.x] = giaTri;
            }
        });
    });
}

function layToaDoBongMo() {
    const bongMo = {
        maTranKhoi: nguoiChoi.maTranKhoi,
        toaDo: { x: nguoiChoi.toaDo.x, y: nguoiChoi.toaDo.y }
    };
    while (!kiemTraVaCham(bangXepGach, bongMo)) {
        bongMo.toaDo.y++;
    }
    bongMo.toaDo.y--;
    return bongMo.toaDo;
}

function veTroChoi() {
    nguCanhBanCo.fillStyle = '#1f2937';
    nguCanhBanCo.fillRect(0, 0, canvasBanCo.width, canvasBanCo.height);
    veMaTran(bangXepGach, { x: 0, y: 0 });

    nguCanhKhoiTiepTheo.clearRect(0, 0, canvasKhoiTiepTheo.width, canvasKhoiTiepTheo.height);

    if (nguoiChoi.capDo !== 2) {
        veMaTran(nguoiChoi.maTranKhoi, layToaDoBongMo(), nguCanhBanCo, true);

        if (nguoiChoi.maTranTiepTheo) {
            const doLech = {
                x: 2 - nguoiChoi.maTranTiepTheo[0].length / 2,
                y: 2 - nguoiChoi.maTranTiepTheo.length / 2
            };
            veMaTran(nguoiChoi.maTranTiepTheo, doLech, nguCanhKhoiTiepTheo);
        }
    }

    veMaTran(nguoiChoi.maTranKhoi, nguoiChoi.toaDo);
}

function roiKhoiGach() {
    nguoiChoi.toaDo.y++;
    if (kiemTraVaCham(bangXepGach, nguoiChoi)) {
        nguoiChoi.toaDo.y--;
        hopNhatKhoiGach(bangXepGach, nguoiChoi);
        khoiTaoKhoiMoi();
        quetHangHoanThanh();
        capNhatThongSo();
    }
    boDemThoiGianRoi = 0;
}

function roiKhoiNgayLapTuc() {
    nguoiChoi.diemSo += 10;
    while (!kiemTraVaCham(bangXepGach, nguoiChoi)) {
        nguoiChoi.toaDo.y++;
    }
    nguoiChoi.toaDo.y--;
    hopNhatKhoiGach(bangXepGach, nguoiChoi);
    khoiTaoKhoiMoi();
    quetHangHoanThanh();
    capNhatThongSo();
    boDemThoiGianRoi = 0;
}

function diChuyenNguoiChoi(doLech) {
    nguoiChoi.toaDo.x += doLech;
    if (kiemTraVaCham(bangXepGach, nguoiChoi)) {
        nguoiChoi.toaDo.x -= doLech;
    }
}

function xoayKhoiGach() {
    if (nguoiChoi.capDo === 6) {
        return;
    }

    const viTriGocX = nguoiChoi.toaDo.x;
    let doLech = 1;
    xoayMaTran(nguoiChoi.maTranKhoi);
    while (kiemTraVaCham(bangXepGach, nguoiChoi)) {
        nguoiChoi.toaDo.x += doLech;
        doLech = -(doLech + (doLech > 0 ? 1 : -1));
        if (doLech > nguoiChoi.maTranKhoi[0].length) {
            xoayMaTran(nguoiChoi.maTranKhoi, -1);
            nguoiChoi.toaDo.x = viTriGocX;
            return;
        }
    }
}

function xoayMaTran(maTran, huongXoay = 1) {
    for (let y = 0; y < maTran.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [maTran[x][y], maTran[y][x]] = [maTran[y][x], maTran[x][y]];
        }
    }
    if (huongXoay > 0) {
        maTran.forEach(hang => hang.reverse());
    } else {
        maTran.reverse();
    }
}

function khoiTaoKhoiMoi() {
    nguoiChoi.soKhoiDaDat++;

    if (!nguoiChoi.maTranTiepTheo) {
        nguoiChoi.maTranTiepTheo = taoKhoiGach(DANH_SACH_KHOI[Math.floor(Math.random() * DANH_SACH_KHOI.length)]);
    }
    nguoiChoi.maTranKhoi = nguoiChoi.maTranTiepTheo;
    nguoiChoi.maTranTiepTheo = taoKhoiGach(DANH_SACH_KHOI[Math.floor(Math.random() * DANH_SACH_KHOI.length)]);

    nguoiChoi.toaDo.y = 0;
    nguoiChoi.toaDo.x = Math.floor(bangXepGach[0].length / 2) - Math.floor(nguoiChoi.maTranKhoi[0].length / 2);

    if (nguoiChoi.capDo === 4 && nguoiChoi.soKhoiDaDat > 0 && nguoiChoi.soKhoiDaDat % 5 === 0) {
        themHangGachRac();
    }

    if (kiemTraVaCham(bangXepGach, nguoiChoi)) {
        xuLyThuaCuoc();
    }
}

function quetHangHoanThanh() {
    let heSoDiem = 1;
    let soHangXoaDuoc = 0;
    outer: for (let y = bangXepGach.length - 1; y >= 0; --y) {
        for (let x = 0; x < bangXepGach[y].length; ++x) {
            if (bangXepGach[y][x] === 0 || bangXepGach[y][x] === 8) {
                if (bangXepGach[y][x] === 0) continue outer;
            }
        }
        const hangMoi = bangXepGach.splice(y, 1)[0].fill(0);
        bangXepGach.unshift(hangMoi);
        ++y;

        soHangXoaDuoc++;
        nguoiChoi.diemSo += heSoDiem * 100 * nguoiChoi.capDo;
        heSoDiem *= 2;
    }

    if (soHangXoaDuoc > 0) {
        nguoiChoi.soHangDaXoa += soHangXoaDuoc;
        kiemTraLenCap();
    }
}

function thietLapCapDo(capDoMoi) {
    nguoiChoi.capDo = capDoMoi;
    const danhSachTieuDe = ["Classic", "Blind Mode", "Obstacle", "Garbage Attack", "Earthquake", "Sudden Death"];
    document.getElementById('tieu-de-man-choi').innerText = `LEVEL ${capDoMoi}: ${danhSachTieuDe[capDoMoi - 1].toUpperCase()}`;
    document.getElementById('gia-tri-man').innerText = capDoMoi;

    thoiGianRoi = 1000 - (capDoMoi * 100);

    if (capDoMoi === 6) {
        thoiGianRoi = 250;
    }

    if (capDoMoi === 3 && nguoiChoi.soKhoiDaDat === 0) {
        bangXepGach = taoMaTran(10, 20);
        themHangGachRac(3);
    }

    if (capDoMoi === 5) {
        thoiDiemRungChanCuoi = Date.now();
    }
}

function kiemTraLenCap() {
    const nguongDiem = nguoiChoi.capDo * 1000;
    if (nguoiChoi.diemSo >= nguongDiem && nguoiChoi.capDo < 6) {
        thietLapCapDo(nguoiChoi.capDo + 1);
    }
}

function themHangGachRac(soHang = 1) {
    for (let i = 0; i < soHang; i++) {
        bangXepGach.shift();
        const hangRac = new Array(10).fill(8);
        hangRac[Math.floor(Math.random() * 10)] = 0;
        bangXepGach.push(hangRac);
    }
}

function kichHoatDongDat() {
    for (let y = 0; y < bangXepGach.length; ++y) {
        const coKhoiGach = bangXepGach[y].some(giaTri => giaTri > 0);
        if (coKhoiGach && Math.random() > 0.5) {
            const sangTrai = Math.random() > 0.5;
            if (sangTrai) {
                const phanTuDau = bangXepGach[y].shift();
                bangXepGach[y].push(phanTuDau === 0 ? 0 : 8);
            } else {
                const phanTuCuoi = bangXepGach[y].pop();
                bangXepGach[y].unshift(phanTuCuoi === 0 ? 0 : 8);
            }
        }
    }
}

function capNhatVongLap(thoiDiemHienTai = 0) {
    if (dangTamDung || troChoiKetThuc) {
        return;
    }

    const khoangThoiGian = thoiDiemHienTai - thoiDiemTruoc;
    thoiDiemTruoc = thoiDiemHienTai;
    boDemThoiGianRoi += khoangThoiGian;

    if (boDemThoiGianRoi > thoiGianRoi) {
        roiKhoiGach();
    }

    if (nguoiChoi.capDo === 5 && Date.now() - thoiDiemRungChanCuoi > 10000) {
        kichHoatDongDat();
        thoiDiemRungChanCuoi = Date.now();
    }

    veTroChoi();
    maYeuCauHoatHoa = requestAnimationFrame(capNhatVongLap);
}

function capNhatThongSo() {
    document.getElementById('gia-tri-diem').innerText = nguoiChoi.diemSo;
    document.getElementById('gia-tri-hang').innerText = nguoiChoi.soHangDaXoa;
}

function xuLyThuaCuoc() {
    troChoiKetThuc = true;
    cancelAnimationFrame(maYeuCauHoatHoa);
    document.getElementById('tieu-de-thong-bao').innerText = "GAME OVER";
    document.getElementById('noi-dung-thong-bao').innerText = `Level đạt được: ${nguoiChoi.capDo} | Điểm: ${nguoiChoi.diemSo}`;
    document.getElementById('nut-tiep-tuc').classList.add('an');
    document.getElementById('lop-phu-thong-bao').classList.add('kich-hoat');
}

function chuyenDoiTamDung() {
    if (troChoiKetThuc) {
        return;
    }
    dangTamDung = !dangTamDung;
    if (dangTamDung) {
        cancelAnimationFrame(maYeuCauHoatHoa);
        document.getElementById('tieu-de-thong-bao').innerText = "TẠM DỪNG";
        document.getElementById('noi-dung-thong-bao').innerText = "";
        document.getElementById('nut-tiep-tuc').classList.remove('an');
        document.getElementById('lop-phu-thong-bao').classList.add('kich-hoat');
    } else {
        document.getElementById('lop-phu-thong-bao').classList.remove('kich-hoat');
        thoiDiemTruoc = performance.now();
        capNhatVongLap();
    }
}

function chuyenManHinh(idManHinh) {
    document.querySelectorAll('.man-hinh').forEach(manHinh => manHinh.classList.remove('kich-hoat'));
    document.getElementById(idManHinh).classList.add('kich-hoat');
}

function batDauTroChoi(capDo) {
    bangXepGach = taoMaTran(10, 20);
    nguoiChoi.diemSo = 0;
    nguoiChoi.soHangDaXoa = 0;
    nguoiChoi.soKhoiDaDat = 0;
    nguoiChoi.maTranTiepTheo = null;

    thietLapCapDo(capDo);
    capNhatThongSo();
    khoiTaoKhoiMoi();

    troChoiKetThuc = false;
    dangTamDung = false;
    document.getElementById('lop-phu-thong-bao').classList.remove('kich-hoat');

    chuyenManHinh('man-hinh-tro-choi');
    thoiDiemTruoc = performance.now();
    capNhatVongLap();
}

function thoatTroChoi() {
    troChoiKetThuc = true;
    cancelAnimationFrame(maYeuCauHoatHoa);
    chuyenManHinh('man-hinh-menu');
    document.getElementById('lop-phu-thong-bao').classList.remove('kich-hoat');
}

document.addEventListener('keydown', suKien => {
    if (troChoiKetThuc && suKien.keyCode !== 80) {
        return;
    }

    if (suKien.keyCode === 80) {
        if (document.getElementById('man-hinh-tro-choi').classList.contains('kich-hoat')) {
            chuyenDoiTamDung();
        }
        return;
    }

    if (dangTamDung) {
        return;
    }

    switch (suKien.keyCode) {
        case 37:
            diChuyenNguoiChoi(-1);
            veTroChoi();
            break;
        case 39:
            diChuyenNguoiChoi(1);
            veTroChoi();
            break;
        case 40:
            roiKhoiGach();
            veTroChoi();
            break;
        case 38:
            xoayKhoiGach();
            veTroChoi();
            break;
        case 32:
            roiKhoiNgayLapTuc();
            veTroChoi();
            break;
    }
});