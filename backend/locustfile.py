from locust import HttpUser, task, between


class ExamUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login
        response = self.client.post(
            "/api/auth/login/",
            json={
                "username": "YOUR_USERNAME",
                "password": "YOUR_PASSWORD"
            },
            name="/api/auth/login/"
        )

        if response.status_code == 200:
            data = response.json()

            # ببینیم پاسخ API چه کلیدی برای access token دارد
            print(data)

            access_token = data.get("access")

            if access_token:
                self.client.headers.update({
                    "Authorization": f"Bearer {access_token}"
                })
            else:
                print("ACCESS TOKEN NOT FOUND!")

        else:
            print(
                f"LOGIN FAILED: {response.status_code} - {response.text}"
            )

    @task
    def get_exams(self):
        self.client.get("/api/exams/")