#!/bin/sh
# install dotnet
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
sudo yum install -y dotnet-sdk-3.1

# install apache
yum install -y httpd mod_ssl

# copy self-signed keys
mkdir /etc/ssl/private
chmod 700 /etc/ssl/private
cp ../cert/pspace.crt /etc/ssl/private/
cp ../cert/pspace.key /etc/ssl/private/

# copy configuration files
cp ../apache/conf.d/ssl.conf /etc/httpd/conf.d/
cp ../apache/conf/httpd.conf /etc/httpd/conf/

# restart httpd
systemctl enable httpd.service
systemctl restart httpd.service
