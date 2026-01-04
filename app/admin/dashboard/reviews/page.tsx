import React from "react";
import { Star } from "lucide-react";

import { getLatestProductReviews } from "@/lib/database/actions/admin/products/products.actions";
import SwitchComponent from "@/components/admin/dashboard/reviews/switch";
import DeleteReviewButton from "@/components/admin/dashboard/reviews/delete-button";
import { Group } from "@mantine/core";

const ReviewsPage = async () => {
  let all_reviews = null;
  let reviews = [];
  
  try {
    all_reviews = await getLatestProductReviews();
    reviews = all_reviews?.reviews || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    reviews = [];
  }

  if (!reviews || reviews.length === 0) return <p>No reviews found.</p>;
  
  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">Latest Reviews</h1>
      <div className="space-y-4">
        {reviews.map((reviewData: any, index: number) => {
          const { productName, productDescription, review, productImage } =
            reviewData;
          const {
            rating,
            review: comment,
            reviewCreatedAt,
            reviewBy,
            verified,
            _id,
          } = review;
          const { username, email, image } = reviewBy;

          return (
            <div key={index} className="border-b-2 pb-4 last:border-0">
              <div className="flex gap-[10px]">
                <div className="">
                  <img
                    src={productImage?.[0]?.url || "/placeholder.jpg"}
                    alt="_"
                    className="w-[100px] object-cover"
                  />
                </div>
                <div className="flex-1">
                  {/* Product Information */}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">{productName || "Unknown Product"}</h2>
                    <p className="text-gray-600">{productDescription || "No description available"}</p>
                  </div>

                  {/* Review Rating */}
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 border-none ${
                          i < (rating || 0)
                            ? "border-none fill-yellow-400"
                            : "stroke-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Comment */}
                  <p className="mb-2">{comment || "No comment"}</p>

                  {/* Reviewer Details */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <img
                        src={image || "/placeholder-avatar.jpg"}
                        alt={username || email || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{username || email || "Anonymous"}</span>
                      <span>|</span>
                      <span>
                        {reviewCreatedAt ? new Date(reviewCreatedAt).toLocaleDateString() : "Unknown date"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <SwitchComponent _id={_id} verified={verified} />
                    <DeleteReviewButton reviewId={_id} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewsPage;
