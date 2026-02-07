<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlackoutDate extends Model
{
    protected $fillable = [
        'date',
        'raison',
        'created_by'
    ];

    protected $casts = [
        'date' => 'date',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    // Relations
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now());
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('date', [$start, $end]);
    }

    // Méthodes statiques
    public static function isBlackout($date)
    {
        return self::where('date', $date)->exists();
    }

    public static function getBlackoutDates($startDate = null, $endDate = null)
    {
        $query = self::query();

        if ($startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        return $query->pluck('date')->toArray();
    }
}