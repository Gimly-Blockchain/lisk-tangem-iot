sudo -u postgres psql -c "drop database lisk_dev;"
sudo -u postgres psql -c "CREATE DATABASE lisk_dev OWNER lisk;";
# sudo -u postgres psql -d lisk_dev -c "alter user lisk with password 'lisk123';"
# rm ./logs/devnet/*