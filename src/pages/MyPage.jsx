import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Edit2,
  Trash2,
  Heart,
  Smile,
  AlertCircle,
  SquareX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import UserInfo from "@/components/MyPage/UserInfo";
import EditProduct from "@/components/MyPage/EditProduct";
import AuctionBid from "@/components/MyPage/AuctionBid";
import AuctionSale from "@/components/MyPage/AuctionSale";
import { getUserInfo } from "@/api/userApi";
import {
  getMyProducts,
  getAuctionBid,
  editProduct,
  deleteProduct,
  updatePassword,
  updateReceiverInfo,
  confirmOrder,
  getLikedProducts,
  toggleLikes,
} from "@/api/productApi";

// 상품 아이템 컴포넌트
const ContentItem = ({ item, onToggleLike }) => (
  <div className="flex items-center border-b py-4">
    <img
      src={item.thumbnailUrl || item.imageUrl}
      alt={item.name}
      className="w-20 h-20 object-cover mr-4"
    />
    <div className="flex-grow">
      <h3 className="font-semibold">{item.name || item.productName}</h3>
      <p className="text-red-500 font-bold">
        경매시작가 : {item.price.toLocaleString()}원
      </p>
    </div>
    <div className="flex flex-col items-center">
      <Button
        className="bg-red-200 hover:bg-red-300 text-red-700 px-2 py-2 rounded-xl transition duration-300 ease-in-out"
        onClick={() => onToggleLike(item.productId)}
      >
        찜 해제 <SquareX className="ml-1" size={20} />
      </Button>
    </div>
  </div>
);

// 콘텐츠 영역
const ContentArea = ({ tabValue, content, onDelete, onUploadSuccess }) => (
  <Card className="w-[750px] h-full min-h-[600px] max-h-[80vh] overflow-hidden bg-white">
    <div className="sticky top-0 bg-white z-10 pt-6 px-5">
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">{tabValue}</div>
        <div className="flex items-center">
          {tabValue === "등록 상품 관리" ? (
            <div className="flex items-center bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
              <AlertCircle size={16} className="mr-1" />
              <span>
                경매가 진행중이거나 종료된 상품은 수정 또는 삭제가 불가능합니다
                !
              </span>
            </div>
          ) : (
            <p className="font-bold">전체 {content.length}개</p>
          )}
        </div>
      </div>

      <hr className="border-gray-300 mb-2" />
    </div>
    <div className="pl-5 overflow-y-auto h-[calc(80vh-70px)]">
      {tabValue === "등록 상품 관리" ? (
        <MyProducts onUploadSuccess={onUploadSuccess} />
      ) : content.length > 0 ? (
        content.map((item, index) => (
          <ContentItem
            key={index}
            item={item}
            onDelete={() => onDelete(item.id)}
          />
        ))
      ) : (
        <div className="flex justify-center items-center h-full">
          <p>내용이 없습니다.</p>
        </div>
      )}
    </div>
  </Card>
);

// 내 상품 컴포넌트
const MyProducts = ({ onUploadSuccess }) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const token = useSelector((state) => state.auth.access_token);
  const memberId = useSelector((state) => state.auth.userData.memberId);
  const [editProductId, setEditProductId] = useState(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = (productId) => {
    setEditProductId(productId);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const fetchProducts = async () => {
    // console.log(memberId);
    try {
      const params = {
        memberId: memberId,
        page: page,
        size: size,
        // size: 20,
      };
      const response = await getMyProducts(token, params);

      if (response && Array.isArray(response.content)) {
        setProducts(response.content);
      } else {
        console.error(
          "API response does not contain a valid content array:",
          response
        );
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    if (token && memberId) {
      fetchProducts();
    }
  }, [token, memberId]);

  const handleUpdate = async (productId, productData) => {
    try {
      await editProduct(token, productId, productData);
      fetchProducts(); // 업데이트 후 상품 목록 갱신
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(token, productToDelete.productId);
        setProducts(
          products.filter(
            (product) => product.productId !== productToDelete.productId
          )
        );
        onUploadSuccess();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="h-full min-h-[600px] max-h-[80vh] overflow-hidden bg-white">
      <div className="pr-5 overflow-y-auto h-[calc(80vh-70px)]">
        <EditProduct
          productId={editProductId}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
        {Array.isArray(products) && products.length > 0 ? (
          products.map((product) => (
            <Card
              key={product.productId}
              className={`mb-4 overflow-hidden ${
                product.status !== "UPCOMING" ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex items-center py-4 px-5">
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-md mr-4"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 truncate mb-2">
                    {product.introduction}
                  </p>
                  {product.status === "ENDED" ? (
                    <p className="text-red-500 font-bold">
                      최종 낙찰 금액:{" "}
                      {(product.finalPrice || product.price).toLocaleString()}원
                    </p>
                  ) : (
                    <p className="text-blue-500 font-bold">
                      경매 시작가: {product.price.toLocaleString()}원
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  {product.status === "UPCOMING" ? (
                    <div className="flex flex-row">
                      <Button
                        onClick={() => openModal(product.productId)}
                        className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 mr-2"
                        variant="outline"
                      >
                        <Edit2 size={16} className="mr-2" />
                        수정
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(product)}
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        variant="outline"
                      >
                        <Trash2 size={16} className="mr-2" />
                        삭제
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <span className="font-semibold">
                        {product.status === "ONGOING"
                          ? "경매 진행중"
                          : "경매 종료"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <p>상품이 없습니다.</p>
          </div>
        )}
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// 회원 정보 조회
const UserInfoContent = () => {
  const [userInfo, setUserInfo] = useState(null);
  const access_token = useSelector((state) => state.auth.access_token);
  const userData = useSelector((state) => state.auth.userData);

  const fetchUserInfo = async () => {
    try {
      const response = await getUserInfo(access_token, userData.memberId);
      setUserInfo(response.data);
    } catch (error) {
      console.error("회원정보 조회 실패:", error);
    }
  };
  useEffect(() => {
    if (access_token && userData.memberId) {
      fetchUserInfo();
    }
  }, [access_token, userData.memberId]);

  return (
    <Card className="min-w-[650px] h-full min-h-[600px] max-h-[80vh] overflow-hidden bg-white p-6">
      <Card className="min-w-[500px] min-h-[200px] bg-gray-white shadow-md p-5 mb-8">
        <h2 className="text-xl font-bold mb-4">회원 정보</h2>
        {userInfo ? (
          <div className="flex items-start space-x-4">
            <div className="bg-gray-100 rounded-full p-2">
              <Smile className="w-10 h-10 text-gray-600" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <div className="flex-shrink-0 mr-2">
                  <h2 className="text-lg font-bold">좋은 하루 되세요! 🍀</h2>
                  <p className="text-md">{userInfo.email} 회원님</p>
                  <p className="text-sm text-gray-600">
                    {userInfo.role} 등급이네요!
                  </p>
                </div>
                <div className="flex space-x-2">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold">캐시</h3>
                    <p className="text-md font-bold">
                      {parseInt(userInfo.cash).toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-semibold">포인트</h3>
                    <p className="text-md font-bold">{userInfo.point}P</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p>로그인하셔야 본 서비스를 이용하실 수 있습니다.</p>
          </div>
        )}
      </Card>
      <Card className="min-w-[00px] min-h-[00px] bg-white p-5 shadow-md">
        <ChangePassword />
      </Card>
    </Card>
  );
};

// 비밀번호 변경
const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const token = useSelector((state) => state.auth.access_token);
  const memberId = useSelector((state) => state.auth.userData.memberId);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      const passwordData = {
        currentPassword: currentPassword,
        password: newPassword,
        confirmPassword: confirmPassword,
      };

      await updatePassword(token, memberId, passwordData);

      setIsAlertOpen(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("비밀번호 변경 실패: " + error.response.data.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">비밀번호 변경</h2>
      <div className="flex flex-col h-full items-center">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex mb-4 w-[80%]">
          <label className="w-1/3 flex items-center justify-start">
            비밀번호
          </label>
          <input
            type="password"
            placeholder="현재 비밀번호를 입력해 주세요"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border p-2 w-2/3 rounded-lg"
          />
        </div>
        <div className="flex mb-4 w-[80%]">
          <label className="w-1/3 flex items-center justify-start">
            새 비밀번호
          </label>
          <input
            type="password"
            placeholder="새 비밀번호를 입력해 주세요"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border p-2 w-2/3 rounded-lg"
          />
        </div>
        <div className="flex mb-4 w-[80%]">
          <label className="w-1/3 flex items-center justify-start">
            새 비밀번호 확인
          </label>
          <input
            type="password"
            placeholder="새 비밀번호를 다시 입력해 주세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 w-2/3 rounded-lg"
          />
        </div>
        <div className="flex-grow flex items-center justify-center">
          <Button
            onClick={handleChangePassword}
            className="w-full max-w-xs m-5"
          >
            비밀번호 변경
          </Button>
        </div>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>비밀번호 변경 완료</AlertDialogTitle>
            <AlertDialogDescription>
              비밀번호가 성공적으로 변경되었습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction onClick={() => setIsAlertOpen(false)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// // 찜하기 토글

// const handleToggleLike = async (productId) => {
//   try {
//     await toggleLike(token, productId, false); // false로 설정하여 찜하기 취소
//     setProducts((prev) =>
//       prev.filter((product) => product.productId !== productId)
//     );
//   } catch (error) {
//     console.error("찜하기 상태 변경 중 오류 발생:", error);
//   }
// };

// const handleSort = (sortByValue) => {
//   setSortBy(sortByValue);
//   setIsAsc(!isAsc);
//   setPage(1);
//   setProducts([]);
// };

// 찜한 상품 조회

const LikedProducts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [isAsc, setIsAsc] = useState(false);
  const token = useSelector((state) => state.auth.access_token);

  const fetchProducts = async (resetProducts = false) => {
    try {
      const response = await getLikedProducts(token, page, size, sortBy, isAsc);
      if (response && Array.isArray(response.content)) {
        setProducts((prev) =>
          resetProducts ? response.content : [...prev, ...response.content]
        );
        if (response.content.length > 0) {
          setPage((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("찜한 상품 조회 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchProducts(true);
  }, [sortBy, isAsc]);

  const toggleSortOrder = () => {
    setIsAsc((prev) => !prev);
  };

  const handleToggleLike = async (productId) => {
    const requestBody = {
      productId: productId,
      press: false,
    };
    try {
      await toggleLikes(token, requestBody);
      setProducts((prev) =>
        prev.filter((product) => product.productId !== productId)
      );
    } catch (error) {
      console.error("찜하기 상태 변경 중 오류 발생:", error);
    }
  };

  return (
    <Card className="h-full min-h-[600px] max-h-[80vh] overflow-hidden bg-white">
      <div className="sticky top-0 bg-white z-10 pt-6 px-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold mb-4">찜한 상품 목록</h2>
          <p className="font-bold mb-4">전체 {products.length}개</p>
        </div>
        <hr className="border-gray-300 mb-2" />
      </div>
      <div className="pl-5 pr-5 overflow-y-auto h-[calc(80vh-70px)]">
        {products.length > 0 ? (
          products.map((product) => (
            <ContentItem
              key={product.productId}
              item={{
                ...product,
                thumbnailUrl: product.thumbnailUrl || product.imageUrl,
                name: product.name || product.productName,
              }}
              onToggleLike={() => handleToggleLike(product.productId)}
            />
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <p>찜한 상품이 없습니다.</p>
          </div>
        )}
      </div>
      {products.length > 0 && products.length % size === 0 && (
        <div className="flex justify-center mt-4 mb-4">
          <Button
            onClick={() => fetchProducts()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            더 보기
          </Button>
        </div>
      )}
    </Card>
  );
};

// 마이페이지 컴포넌트
const MyPage = () => {
  const user = useSelector((state) => state.auth.userData);
  const [activeTab, setActiveTab] = useState("찜한 상품");
  const [likedProductsCount, setLikedProductsCount] = useState(0);
  const [auctionBidCount, setAuctionBidCount] = useState(0);
  const [auctionSaleCount, setAuctionSaleCount] = useState(0);
  const [myProductsCount, setMyProductsCount] = useState(0);
  const token = useSelector((state) => state.auth.access_token);

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
  };
  const fetchLikedProducts = async () => {};
  const fetchAuctionBids = async () => {};
  const fetchAuctionSales = async () => {};
  const fetchMyProducts = async () => {
    try {
      const response = await getMyProducts(token);
      if (response && Array.isArray(response.content)) {
        setMyProductsCount(response.content.length);
      } else {
        setMyProductsCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setMyProductsCount(0);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLikedProducts();
      fetchAuctionBids();
      fetchAuctionSales();
      fetchMyProducts();
    }
  }, [token]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#e2e8f0] pt-28 ">
      <div className="w-full max-w-[1200px] flex gap-8">
        <div className="w-full h-auto flex gap-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full flex gap-8 text-left"
          >
            <div className="w-[300px] h-auto">
              <UserInfo user={user} token={token} />
              <Card className="w-[300px] h-auto mb-6 bg-white">
                <TabsList className="flex flex-col items-stretch h-auto">
                  {[
                    { name: "찜한 상품" },
                    { name: "경매 신청 내역" },
                    { name: "경매 판매 내역" },
                    { name: "등록 상품 관리" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.name}
                      value={tab.name}
                      className={`justify-between h-16 ${
                        activeTab === tab.name
                          ? "text-blue-600 font-bold"
                          : "text-gray-800"
                      }`}
                    >
                      <span>{tab.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Card>
              <Card className="h-auto bg-white">
                <TabsList className="flex flex-col items-stretch h-auto">
                  {["개인정보 수정"].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className={`justify-between h-16 ${
                        activeTab === tab
                          ? "text-blue-600 font-bold"
                          : "text-gray-800"
                      }`}
                    >
                      <span>{tab}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Card>
            </div>
            <div className="w-[750px] h-auto">
              <div className="h-full flex flex-col">
                <TabsContent value="찜한 상품">
                  <LikedProducts />
                </TabsContent>
                <TabsContent value="경매 신청 내역">
                  <AuctionBid />
                </TabsContent>
                <TabsContent value="경매 판매 내역">
                  <AuctionSale />
                </TabsContent>
                <TabsContent value="등록 상품 관리">
                  <ContentArea
                    tabValue="등록 상품 관리"
                    content={[]}
                    onUploadSuccess={fetchMyProducts}
                  />
                </TabsContent>
                <TabsContent value="개인정보 수정">
                  <UserInfoContent />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
