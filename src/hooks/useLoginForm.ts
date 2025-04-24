import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserServices } from "@/services/UserServices";
import { postLog } from "@/services/logFunctions";

interface LoginFormData {
  email: string;
  password: string;
}

const useLoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await UserServices.loginUser(formData);

      if (response.status === 200 && response.data) {
        await postLog("User logged in", "info", { email: formData.email });
        router.push("/");
      } else {
        setErrorMessage(
          response?.data?.message ||
            "Error de autenticación. Por favor, intenta de nuevo."
        );
      }
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Un error inesperado ha ocurrido. Por favor, intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    errorMessage,
    handleInputChange,
    handleSubmit,
  };
};

export default useLoginForm;
