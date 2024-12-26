<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "datamart";

// Membuat koneksi
$conn = new mysqli($servername, $username, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Query untuk mengambil data penjualan
$sql = "SELECT product_name, sales_amount, unit_price, transaction_date FROM transaksi_penjualan";
$result = $conn->query($sql);

$data = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
} else {
    echo "0 results";
}
$conn->close();

// Mengirim data dalam format JSON
echo json_encode($data);
?>