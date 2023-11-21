# Use an official Python runtime as a base image
FROM python:3.11

# Install necessary system dependencies
RUN apt-get update && \
    apt-get install -y libgl1-mesa-glx

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . /app

# Expose port 5000 to allow communication
EXPOSE 5000

# Run app.py when the container launches
CMD ["python", "app.py"]
